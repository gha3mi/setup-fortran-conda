import { addPath, endGroup, info, startGroup } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { appendFileSync, existsSync } from 'node:fs';
import { EOL } from 'node:os';
import { basename, join, sep } from 'node:path';

const DEFAULT_WRAPPERS = Object.freeze({
  fortran: 'mpifort',
  c: 'mpicc',
  cxx: 'mpicxx',
});

const DEFAULT_LAUNCHER = Object.freeze({
  command: 'mpiexec',
  numProcFlag: '-n',
});

export async function grouped(name, operation) {
  startGroup(name);
  try {
    return await operation();
  } finally {
    endGroup();
  }
}

export function exportEnv(key, value) {
  if (value == null) return;

  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');

  const normalized = String(value);
  if (/[\r\n]/.test(normalized)) {
    throw new Error(`Cannot export multiline MPI environment variable ${key}.`);
  }

  appendFileSync(envFile, `${key}=${normalized}${EOL}`);
  process.env[key] = normalized;
}

export async function execCapture(command, args = []) {
  let stdout = '';
  let stderr = '';
  const exitCode = await _exec(command, args, {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
      stderr: (data) => {
        stderr += data.toString();
      },
    },
  });

  return { stdout, stderr, exitCode };
}

export async function getCondaPrefix(envName = 'fortran') {
  const result = await execCapture('conda', ['env', 'list', '--json']);
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect Conda environments: ${result.stderr || result.stdout}`
    );
  }

  const { envs = [] } = JSON.parse(result.stdout);
  const prefix = envs.find(
    (candidate) =>
      candidate.endsWith(sep + envName) ||
      candidate.endsWith('/' + envName)
  );

  if (!prefix) throw new Error(`Unable to locate Conda environment "${envName}".`);
  return prefix;
}

export async function installCondaPackages(packages, channels) {
  await grouped('setup-fortran-conda: Install MPI Packages', async () => {
    try {
      const args = ['install', '--yes', '--name', 'fortran', ...packages];
      for (const channel of channels) args.push('-c', channel);
      await _exec('conda', args);
    } catch (error) {
      throw new Error(`MPI package installation failed: ${error.message}`);
    }
  });
}

export function addCondaPaths(prefix, osKey) {
  const candidates =
    osKey === 'win'
      ? [
          join(prefix, 'bin'),
          join(prefix, 'Library', 'bin'),
          join(prefix, 'Library', 'usr', 'bin'),
          join(prefix, 'Scripts'),
        ]
      : [join(prefix, 'bin')];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      addPath(candidate);
      info(`Added MPI path: ${candidate}`);
    }
  }
}

export async function getCondaPackageVersion(packageName) {
  const result = await execCapture('conda', [
    'list',
    '--name',
    'fortran',
    packageName,
    '--json',
  ]);
  if (result.exitCode !== 0) return 'Unknown';

  try {
    const packages = JSON.parse(result.stdout);
    const match = packages.find((pkg) => pkg.name === packageName);
    return match?.version || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export async function commandPath(command) {
  const lookup =
    process.platform === 'win32'
      ? ['where', [command]]
      : ['which', [command]];
  const result = await execCapture(lookup[0], lookup[1]);
  const resolved = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (result.exitCode !== 0 || !resolved) {
    throw new Error(`Required MPI command "${command}" was not found in PATH.`);
  }

  return resolved;
}

export function normalizedCommandName(command) {
  return basename(String(command || ''))
    .toLowerCase()
    .replace(/\.(exe|bat|cmd)$/i, '');
}

export function hostedRunnerUcxEnvironment(osKey) {
  const hasAzureMana =
    process.env.RUNNER_ENVIRONMENT === 'github-hosted' &&
    osKey === 'lin' &&
    existsSync('/sys/class/infiniband/mana_0');

  if (!hasAzureMana || process.env.UCX_TLS) {
    return {};
  }

  info('Disabled unusable UCX UD transports exposed by this GitHub-hosted runner');
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

export function applyEnvironment(values) {
  for (const [key, value] of Object.entries(values || {})) {
    if (value != null) process.env[key] = String(value);
  }
}

export function exportMpiEnvironment(descriptor) {
  const values = {
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

  return grouped('setup-fortran-conda: Export MPI Environment', async () => {
    for (const [key, value] of Object.entries(values)) {
      exportEnv(key, value);
      info(`Exported: ${key}=${value}`);
    }
  });
}
