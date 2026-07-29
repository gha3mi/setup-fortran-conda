import { info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import {
  addCondaPaths,
  createMpiDescriptor,
  execCapture,
  getCondaPrefix,
  grouped,
  installCondaPackages,
} from './common.js';

function prependPath(value, current = '') {
  return [value, current].filter(Boolean).join(delimiter);
}

function prependFlag(value, current = '') {
  return [value, current].filter(Boolean).join(' ');
}

async function installIntelMpiWheel(mpiVersion) {
  await installCondaPackages(['pip'], ['conda-forge']);

  const packageSpec = mpiVersion ? `impi-devel==${mpiVersion}` : 'impi-devel';
  await grouped('setup-fortran-conda: Install Intel MPI SDK', async () => {
    try {
      await _exec('conda', [
        'run',
        '--name',
        'fortran',
        'python',
        '-m',
        'pip',
        'install',
        '--disable-pip-version-check',
        packageSpec,
      ]);
    } catch (error) {
      throw new Error(`Intel MPI SDK installation failed: ${error.message}`);
    }
  });
}

async function getIntelMpiVersion(prefix, osKey) {
  const python =
    osKey === 'win'
      ? join(prefix, 'python.exe')
      : join(prefix, 'bin', 'python');
  const result = await execCapture(python, [
    '-c',
    'import json; from importlib.metadata import version; ' +
      'print(json.dumps(version("impi-devel")))',
  ]);
  if (result.exitCode !== 0) return 'Unknown';

  try {
    const version = JSON.parse(result.stdout.trim());
    return typeof version === 'string' && version.trim()
      ? version.trim()
      : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function assertIntelMpiLayout(root, osKey) {
  const required =
    osKey === 'win'
      ? [
          join(root, 'bin', 'mpiifx.bat'),
          join(root, 'bin', 'mpiexec.exe'),
          join(root, 'include', 'mpi', 'mpi_f08.mod'),
          join(root, 'lib', 'impi.lib'),
        ]
      : [
          join(root, 'bin', 'mpiifx'),
          join(root, 'bin', 'mpiexec'),
          join(root, 'include', 'mpi', 'mpi_f08.mod'),
          join(root, 'lib', 'libmpifort.so'),
        ];
  const missing = required.filter((candidate) => !existsSync(candidate));
  if (missing.length) {
    throw new Error(
      `Intel MPI SDK installation is incomplete; missing: ${missing.join(', ')}`
    );
  }
}

async function configureLinuxWrapper(environment) {
  const configDirectory = await mkdtemp(
    join(process.env.RUNNER_TEMP || tmpdir(), 'intel-mpi-wrapper-')
  );
  await writeFile(
    join(configDirectory, 'mpif90-ifx.conf'),
    'modincdir="${I_MPI_ROOT}/include/mpi"\n',
    'utf8'
  );
  environment.I_MPI_COMPILER_CONFIG_DIR = configDirectory;
  info(`Configured Intel MPI wrapper modules: ${environment.I_MPI_ROOT}/include/mpi`);
}

export async function setupIntelMpi({ mpiVersion, osKey }) {
  await installIntelMpiWheel(mpiVersion);

  const prefix = await getCondaPrefix();
  const root = osKey === 'win' ? join(prefix, 'Library') : prefix;
  assertIntelMpiLayout(root, osKey);
  addCondaPaths(prefix, osKey);

  const actualVersion = await getIntelMpiVersion(prefix, osKey);
  info(`Configured Intel MPI ${actualVersion} from the official Intel wheel`);

  const environment = {
    I_MPI_ROOT: root,
    I_MPI_FC: 'ifx',
    I_MPI_F77: 'ifx',
    I_MPI_F90: 'ifx',
    I_MPI_CHECK_COMPILER: 'enable',
  };
  if (osKey === 'win') {
    environment.CMPLR_ROOT = process.env.CMPLR_ROOT || root;
    environment.INCLUDE = prependPath(
      join(root, 'include', 'mpi'),
      prependPath(join(root, 'include'), process.env.INCLUDE)
    );
    environment.LIB = prependPath(join(root, 'lib'), process.env.LIB);
    environment.FFLAGS = prependFlag(
      `-I"${join(root, 'include', 'mpi')}"`,
      process.env.FFLAGS
    );
  } else {
    await configureLinuxWrapper(environment);
    environment.LD_LIBRARY_PATH = prependPath(
      join(root, 'lib'),
      process.env.LD_LIBRARY_PATH
    );
    environment.LIBRARY_PATH = prependPath(
      join(root, 'lib'),
      process.env.LIBRARY_PATH
    );
    environment.FI_PROVIDER_PATH = prependPath(
      join(root, 'lib'),
      process.env.FI_PROVIDER_PATH
    );
  }

  return createMpiDescriptor({
    implementation: 'intelmpi',
    version: actualVersion,
    root,
    wrappers: {
      fortran: 'mpiifx',
      c: 'mpiicx',
      cxx: 'mpiicpx',
    },
    wrapperProbeArgs: ['-show'],
    versionProbe: { command: 'mpiexec', args: ['-version'] },
    expectedFortranCompiler: 'ifx',
    environment,
  });
}
