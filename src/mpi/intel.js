import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TOOLS_ENVIRONMENT_NAME } from '../lib/conda.js';
import { prependFlag, prependPathEntries } from '../lib/environment.js';
import { getErrorMessage } from '../lib/errors.js';
import {
  addMpiPaths,
  captureCommand,
  createMpiDescriptor,
  getCondaPrefix,
  installMpiPackages,
  runInGroup,
} from './common.js';

async function installIntelMpiWheel(mpiVersion) {
  await installMpiPackages(['pip']);

  const mpiPackageSpec = mpiVersion
    ? `impi-devel==${mpiVersion}`
    : 'impi-devel';
  await runInGroup('setup-fortran-conda: Install Intel MPI SDK', async () => {
    try {
      await exec('conda', [
        'run',
        '--name',
        TOOLS_ENVIRONMENT_NAME,
        'python',
        '-m',
        'pip',
        'install',
        '--disable-pip-version-check',
        mpiPackageSpec,
      ]);
    } catch (error) {
      throw new Error(
        `Intel MPI SDK installation failed: ${getErrorMessage(error)}`,
        { cause: error },
      );
    }
  });
}

async function getIntelMpiVersion(condaPrefix, operatingSystem) {
  const pythonExecutable =
    operatingSystem === 'windows'
      ? join(condaPrefix, 'python.exe')
      : join(condaPrefix, 'bin', 'python');
  const result = await captureCommand(pythonExecutable, [
    '-c',
    'import json; from importlib.metadata import version; ' +
      'print(json.dumps(version("impi-devel")))',
  ]);
  if (result.exitCode !== 0) {
    return 'Unknown';
  }

  try {
    const version = JSON.parse(result.stdout.trim());
    return typeof version === 'string' && version.trim()
      ? version.trim()
      : 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function assertIntelMpiLayout(mpiRoot, operatingSystem) {
  const requiredPaths =
    operatingSystem === 'windows'
      ? [
          join(mpiRoot, 'bin', 'mpiifx.bat'),
          join(mpiRoot, 'bin', 'mpiexec.exe'),
          join(mpiRoot, 'include', 'mpi', 'mpi_f08.mod'),
          join(mpiRoot, 'lib', 'impi.lib'),
        ]
      : [
          join(mpiRoot, 'bin', 'mpiifx'),
          join(mpiRoot, 'bin', 'mpiexec'),
          join(mpiRoot, 'include', 'mpi', 'mpi_f08.mod'),
          join(mpiRoot, 'lib', 'libmpifort.so'),
        ];
  const missingPaths = requiredPaths.filter(
    (candidate) => !existsSync(candidate),
  );
  if (missingPaths.length) {
    throw new Error(
      `Intel MPI SDK installation is incomplete; missing: ${missingPaths.join(
        ', ',
      )}`,
    );
  }
}

async function configureLinuxWrapper(environment) {
  const configDirectory = await mkdtemp(
    join(process.env.RUNNER_TEMP || tmpdir(), 'intel-mpi-wrapper-'),
  );
  await writeFile(
    join(configDirectory, 'mpif90-ifx.conf'),
    'modincdir="${I_MPI_ROOT}/include/mpi"\n',
    'utf8',
  );
  environment.I_MPI_COMPILER_CONFIG_DIR = configDirectory;
  info(
    `Configured Intel MPI wrapper modules: ${environment.I_MPI_ROOT}/include/mpi`,
  );
}

export async function setupIntelMpi({ mpiVersion, operatingSystem }) {
  await installIntelMpiWheel(mpiVersion);

  const condaPrefix = await getCondaPrefix();
  const mpiRoot =
    operatingSystem === 'windows' ? join(condaPrefix, 'Library') : condaPrefix;
  assertIntelMpiLayout(mpiRoot, operatingSystem);
  addMpiPaths(condaPrefix, operatingSystem);

  const actualVersion = await getIntelMpiVersion(condaPrefix, operatingSystem);
  info(`Configured Intel MPI ${actualVersion} from the official Intel wheel`);

  const environment = {
    I_MPI_ROOT: mpiRoot,
    I_MPI_FC: 'ifx',
    I_MPI_F77: 'ifx',
    I_MPI_F90: 'ifx',
    I_MPI_CHECK_COMPILER: 'enable',
  };
  if (operatingSystem === 'windows') {
    environment.CMPLR_ROOT = process.env.CMPLR_ROOT || mpiRoot;
    environment.INCLUDE = prependPathEntries(
      [join(mpiRoot, 'include', 'mpi'), join(mpiRoot, 'include')],
      process.env.INCLUDE,
    );
    environment.LIB = prependPathEntries(
      [join(mpiRoot, 'lib')],
      process.env.LIB,
    );
    environment.FFLAGS = prependFlag(
      `-I"${join(mpiRoot, 'include', 'mpi')}"`,
      process.env.FFLAGS,
    );
  } else {
    await configureLinuxWrapper(environment);
    environment.LD_LIBRARY_PATH = prependPathEntries(
      [join(mpiRoot, 'lib')],
      process.env.LD_LIBRARY_PATH,
    );
    environment.LIBRARY_PATH = prependPathEntries(
      [join(mpiRoot, 'lib')],
      process.env.LIBRARY_PATH,
    );
    environment.FI_PROVIDER_PATH = prependPathEntries(
      [join(mpiRoot, 'lib')],
      process.env.FI_PROVIDER_PATH,
    );
  }

  return createMpiDescriptor({
    implementation: 'intelmpi',
    version: actualVersion,
    root: mpiRoot,
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
