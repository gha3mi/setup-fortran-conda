import { info } from '@actions/core';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  commandPath,
  execCapture,
  grouped,
  normalizedCommandName,
} from './common.js';

const BINDING_DECLARATIONS = {
  mpi_f08: '  use mpi_f08\n  implicit none',
  mpi: '  use mpi\n  implicit none',
  mpif_h: "  implicit none\n  include 'mpif.h'",
};

function validationSource(declarations) {
  return `program mpi_validate
${declarations}
  integer :: ierr, rank, nprocs
  call MPI_Init(ierr)
  call MPI_Comm_rank(MPI_COMM_WORLD, rank, ierr)
  call MPI_Comm_size(MPI_COMM_WORLD, nprocs, ierr)
  write(*,'(A,I0,A,I0)') 'MPI_RANK=', rank, ' MPI_SIZE=', nprocs
  if (nprocs /= 2 .or. rank < 0 .or. rank >= nprocs) error stop 1
  call MPI_Finalize(ierr)
end program mpi_validate
`;
}

const SOURCES = Object.fromEntries(
  Object.entries(BINDING_DECLARATIONS).map(([binding, declarations]) => [
    binding,
    validationSource(declarations),
  ])
);

function firstVersion(text) {
  const match = String(text || '').match(/\b\d+(?:\.\d+){1,3}\b/);
  return match?.[0] || '';
}

function outputShowsExpectedCompiler(output, expected) {
  const normalizedOutput = String(output || '').toLowerCase();
  const normalizedExpected = normalizedCommandName(expected);
  return normalizedExpected && normalizedOutput.includes(normalizedExpected);
}

async function resolveToolchain(descriptor) {
  return {
    wrappers: {
      fortran: await commandPath(descriptor.wrappers.fortran),
      c: await commandPath(descriptor.wrappers.c),
      cxx: await commandPath(descriptor.wrappers.cxx),
    },
    launcher: {
      ...descriptor.launcher,
      command: await commandPath(descriptor.launcher.command),
    },
  };
}

async function inspectWrapper(wrapper, descriptor) {
  const result = await execCapture(
    wrapper,
    descriptor.wrapperProbe?.args || []
  );
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect MPI Fortran wrapper "${wrapper}": ${output}`
    );
  }

  const expectedCompiler =
    descriptor.expectedFortranCompiler || process.env.FC || '';
  if (!outputShowsExpectedCompiler(output, expectedCompiler)) {
    throw new Error(
      `MPI wrapper/compiler mismatch: ${wrapper} does not report ` +
        `"${expectedCompiler}" as its underlying compiler. Wrapper output: ${output}`
    );
  }

  return { output, expectedCompiler };
}

async function compileBinding(wrapper, directory, binding) {
  const source = join(directory, `${binding}.f90`);
  const executable = join(
    directory,
    process.platform === 'win32' ? `${binding}.exe` : binding
  );
  await writeFile(source, SOURCES[binding], 'utf8');

  const result = await execCapture(wrapper, [source, '-o', executable]);
  return {
    supported: result.exitCode === 0,
    executable,
    diagnostic: `${result.stdout}\n${result.stderr}`.trim(),
  };
}

async function compileBindings(wrapper, directory) {
  const compiled = {};
  for (const binding of Object.keys(SOURCES)) {
    compiled[binding] = await compileBinding(wrapper, directory, binding);
    info(`${binding}: ${compiled[binding].supported ? 'available' : 'unavailable'}`);
  }
  return compiled;
}

function assertRequiredBinding(compiled, requiredBinding) {
  if (compiled[requiredBinding]?.supported) return;

  throw new Error(
    `MPI installation does not provide the required ${requiredBinding} Fortran binding. ` +
      `${compiled[requiredBinding]?.diagnostic || ''}`.trim()
  );
}

async function validateTwoRanks(launcher, executable) {
  const result = await execCapture(launcher.command, [
    launcher.numProcFlag,
    '2',
    executable,
  ]);
  const output = `${result.stdout}\n${result.stderr}`.trim();
  if (result.exitCode !== 0) {
    throw new Error(`MPI two-rank validation failed: ${output}`);
  }

  const rankZero = /MPI_RANK=\s*0\s+MPI_SIZE=\s*2/i.test(output);
  const rankOne = /MPI_RANK=\s*1\s+MPI_SIZE=\s*2/i.test(output);
  if (!rankZero || !rankOne) {
    throw new Error(
      `MPI launcher did not produce exactly the expected two-rank result: ${output}`
    );
  }
}

async function detectVersion(descriptor) {
  if (descriptor.version && descriptor.version !== 'Unknown') {
    return descriptor.version;
  }
  if (!descriptor.versionProbe) return 'Unknown';

  const result = await execCapture(
    descriptor.versionProbe.command,
    descriptor.versionProbe.args
  );
  return firstVersion(`${result.stdout}\n${result.stderr}`) || 'Unknown';
}

export async function validateMpi(descriptor) {
  return grouped('setup-fortran-conda: Validate MPI Toolchain', async () => {
    const resolved = await resolveToolchain(descriptor);
    const wrapperInspection = await inspectWrapper(
      resolved.wrappers.fortran,
      descriptor
    );

    const directory = await mkdtemp(
      join(process.env.RUNNER_TEMP || tmpdir(), 'mpi-validate-')
    );
    const compiled = await compileBindings(
      resolved.wrappers.fortran,
      directory
    );
    const requiredBinding = descriptor.requiredBinding || 'mpi_f08';
    assertRequiredBinding(compiled, requiredBinding);
    await validateTwoRanks(
      resolved.launcher,
      compiled[requiredBinding].executable
    );

    const version = await detectVersion(descriptor);
    info(`Validated ${descriptor.implementation} ${version} with two MPI ranks`);

    return {
      ...descriptor,
      version,
      wrappers: resolved.wrappers,
      resolvedWrappers: resolved.wrappers,
      resolvedLauncher: resolved.launcher,
      bindings: {
        mpi_f08: compiled.mpi_f08.supported,
        mpi: compiled.mpi.supported,
        mpif_h: compiled.mpif_h.supported,
      },
      backendCompiler: wrapperInspection.expectedCompiler,
      wrapperProbeOutput:
        wrapperInspection.output.split(/\r?\n/)[0] ||
        wrapperInspection.output,
      validated: true,
    };
  });
}
