import { addPath, info } from '@actions/core';
import { existsSync } from 'node:fs';
import { captureCommand } from '../lib/command.js';
import {
  exportEnvironment,
  getCondaExecutablePaths,
  getCondaPrefix,
  installCondaPackages,
  runInGroup,
  TOOLS_ENVIRONMENT_NAME,
} from '../compilers/common.js';

export { captureCommand, getCondaPrefix, runInGroup };

const DEFAULT_WRAPPERS = Object.freeze({
  fortran: 'mpifort',
  c: 'mpicc',
  cxx: 'mpicxx',
});

const DEFAULT_LAUNCHER = Object.freeze({
  command: 'mpiexec',
  numProcFlag: '-n',
});

export async function installMpiPackages(packages, channels = ['conda-forge']) {
  await installCondaPackages(packages, {
    channels,
    groupName: 'setup-fortran-conda: Install MPI Packages',
    successMessage: 'MPI packages installed',
    errorMessage: 'MPI package installation failed',
  });
}

export function addMpiPaths(condaPrefix, operatingSystem) {
  const runtimePlatform = operatingSystem === 'windows' ? 'win32' : 'linux';

  for (const candidate of getCondaExecutablePaths(
    condaPrefix,
    runtimePlatform,
  )) {
    if (!existsSync(candidate)) {
      continue;
    }

    addPath(candidate);
    info(`Added MPI path: ${candidate}`);
  }
}

export async function getCondaPackageVersion(packageName) {
  const result = await captureCommand('conda', [
    'list',
    '--name',
    TOOLS_ENVIRONMENT_NAME,
    packageName,
    '--json',
  ]);
  if (result.exitCode !== 0) {
    return 'Unknown';
  }

  try {
    const packages = JSON.parse(result.stdout);
    const match = packages.find((candidate) => candidate.name === packageName);
    return match?.version || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export async function resolveCommandPath(command) {
  const lookup =
    process.platform === 'win32' ? ['where', [command]] : ['which', [command]];
  const result = await captureCommand(lookup[0], lookup[1]);
  const resolvedPath = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (result.exitCode !== 0 || !resolvedPath) {
    throw new Error(`Required MPI command "${command}" was not found in PATH.`);
  }

  return resolvedPath;
}

export function normalizeCommandName(command) {
  return String(command || '')
    .replaceAll('\\', '/')
    .split('/')
    .at(-1)
    .toLowerCase()
    .replace(/\.(exe|bat|cmd)$/i, '');
}

export function createHostedRunnerUcxEnvironment(operatingSystem) {
  const hasAzureMana =
    process.env.RUNNER_ENVIRONMENT === 'github-hosted' &&
    operatingSystem === 'linux' &&
    existsSync('/sys/class/infiniband/mana_0');

  if (!hasAzureMana || process.env.UCX_TLS) {
    return {};
  }

  info(
    'Disabled unusable UCX UD transports exposed by this GitHub-hosted runner',
  );
  return { UCX_TLS: '^ud,ud:aux' };
}

export function createMpiDescriptor({
  implementation,
  version = 'Unknown',
  root,
  wrappers = {},
  launcher = {},
  wrapperProbeArgs,
  versionProbe,
  expectedFortranCompiler,
  environment = {},
}) {
  return {
    implementation,
    version,
    root,
    wrappers: {
      ...DEFAULT_WRAPPERS,
      ...wrappers,
    },
    launcher: {
      ...DEFAULT_LAUNCHER,
      ...launcher,
    },
    wrapperProbe: { args: wrapperProbeArgs },
    versionProbe,
    expectedFortranCompiler,
    requiredBinding: 'mpi_f08',
    environment,
  };
}

export function applyProcessEnvironment(values) {
  for (const [key, value] of Object.entries(values || {})) {
    if (value !== null && value !== undefined) {
      process.env[key] = String(value);
    }
  }
}

export function createMpiEnvironment(descriptor) {
  return {
    MPIFC: descriptor.wrappers.fortran,
    MPIF90: descriptor.wrappers.fortran,
    MPIF77: descriptor.wrappers.fortran,
    MPICC: descriptor.wrappers.c,
    MPICXX: descriptor.wrappers.cxx,
    MPIEXEC:
      descriptor.resolvedLauncher?.command || descriptor.launcher.command,
    MPIEXEC_NUMPROC_FLAG: descriptor.launcher.numProcFlag,
    MPI_HOME: descriptor.root,
    ...(descriptor.environment || {}),
  };
}

export function exportMpiEnvironment(descriptor) {
  return exportEnvironment(
    createMpiEnvironment(descriptor),
    'setup-fortran-conda: Export MPI Environment',
  );
}
