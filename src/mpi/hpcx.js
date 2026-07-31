import { info } from '@actions/core';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  captureCommand,
  createHostedRunnerUcxEnvironment,
  createMpiDescriptor,
  resolveCommandPath,
} from './common.js';

export function extractHpcxVersionFromPath(value) {
  const parts = String(value || '')
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean);

  for (let index = 0; index < parts.length; index += 1) {
    const named = parts[index].match(/^hpcx[-_](\d+(?:\.\d+)+)(?:[-_].*)?$/i);
    if (named) {
      return named[1];
    }

    if (index > 0 && parts[index - 1].toLowerCase() === 'hpcx') {
      const nested = parts[index].match(/^(\d+(?:\.\d+)+)(?:[-_].*)?$/);
      if (nested) {
        return nested[1];
      }
    }
  }

  return '';
}

export function extractOpenMpiPrefix(output) {
  for (const line of String(output || '').split(/\r?\n/)) {
    const parsable = line.match(/^path:prefix:(.+)$/i);
    if (parsable) {
      return parsable[1].trim();
    }

    const pretty = line.match(/^\s*Prefix:\s*(.+)$/i);
    if (pretty) {
      return pretty[1].trim();
    }
  }

  return '';
}

function extractHpcxVersionFromInstalledPath(installedPath) {
  if (!installedPath) {
    return '';
  }

  try {
    const version = extractHpcxVersionFromPath(realpathSync(installedPath));
    if (version) {
      return version;
    }
  } catch {
    // Fall back to the reported path if it cannot be resolved.
  }

  return extractHpcxVersionFromPath(installedPath);
}

function getNvhpcDefaultHpcxPaths(mpiRoot) {
  const communicationLibrariesDirectory = dirname(mpiRoot);
  const candidates = [join(communicationLibrariesDirectory, 'hpcx', 'latest')];

  try {
    for (const name of readdirSync(communicationLibrariesDirectory)) {
      candidates.push(
        join(communicationLibrariesDirectory, name, 'hpcx', 'latest'),
      );
    }
  } catch {
    return [];
  }

  return candidates.filter((candidate) => existsSync(candidate));
}

async function detectHpcxVersion(wrapperCommand, mpiRoot) {
  const candidates = [process.env.HPCX_HOME];

  const wrapperResult = await captureCommand(wrapperCommand, [
    '--showme:incdirs',
  ]);
  if (wrapperResult.exitCode === 0) {
    candidates.push(
      ...wrapperResult.stdout
        .trim()
        .split(/\s+/)
        .map((includePath) => includePath.replace(/^["']|["']$/g, '')),
    );
  }

  try {
    const ompiInfo = await resolveCommandPath('ompi_info');
    const result = await captureCommand(ompiInfo, [
      '--parsable',
      '--path',
      'prefix',
    ]);
    if (result.exitCode === 0) {
      candidates.push(extractOpenMpiPrefix(result.stdout));
    }
  } catch {
    // HPCX_HOME may still identify the active installation.
  }

  for (const candidate of candidates) {
    const version = extractHpcxVersionFromInstalledPath(candidate);
    if (version) {
      return version;
    }
  }

  const defaultVersions = new Set(
    getNvhpcDefaultHpcxPaths(mpiRoot)
      .map(extractHpcxVersionFromInstalledPath)
      .filter(Boolean),
  );
  if (defaultVersions.size === 1) {
    return [...defaultVersions][0];
  }

  return 'Unknown';
}

function createHostedCpuEnvironment() {
  const environment = createHostedRunnerUcxEnvironment('linux');
  const isHostedCpuRunner =
    process.env.RUNNER_ENVIRONMENT === 'github-hosted' &&
    !existsSync('/dev/nvidia0');

  if (!isHostedCpuRunner || process.env.UCX_WARN_UNUSED_ENV_VARS) {
    return environment;
  }

  info(
    'Disabled irrelevant UCX GPU-variable warnings on this CPU-only hosted runner',
  );
  return {
    ...environment,
    UCX_WARN_UNUSED_ENV_VARS: 'n',
  };
}

export async function setupHpcx({ mpiVersion }) {
  if (mpiVersion) {
    throw new Error(
      'mpi-version cannot be set for hpcx because NVIDIA HPC SDK supplies the matching MPI version.',
    );
  }

  const wrapperCommand = await resolveCommandPath('mpifort');
  const mpiRoot = dirname(dirname(wrapperCommand));
  const version = await detectHpcxVersion(wrapperCommand, mpiRoot);
  info(`Detected HPC-X ${version}`);

  return createMpiDescriptor({
    implementation: 'hpcx',
    version,
    root: mpiRoot,
    wrappers: {
      fortran: wrapperCommand,
    },
    wrapperProbeArgs: ['--showme:command'],
    expectedFortranCompiler: 'nvfortran',
    environment: createHostedCpuEnvironment(),
  });
}
