import { info } from '@actions/core';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  commandPath,
  createMpiDescriptor,
  execCapture,
  hostedRunnerUcxEnvironment,
} from './common.js';

export function hpcxVersionFromPath(value) {
  const parts = String(value || '')
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean);

  for (let index = 0; index < parts.length; index += 1) {
    const named = parts[index].match(
      /^hpcx[-_](\d+(?:\.\d+)+)(?:[-_].*)?$/i
    );
    if (named) return named[1];

    if (index > 0 && parts[index - 1].toLowerCase() === 'hpcx') {
      const nested = parts[index].match(
        /^(\d+(?:\.\d+)+)(?:[-_].*)?$/
      );
      if (nested) return nested[1];
    }
  }

  return '';
}

export function openMpiPrefix(output) {
  for (const line of String(output || '').split(/\r?\n/)) {
    const parsable = line.match(/^path:prefix:(.+)$/i);
    if (parsable) return parsable[1].trim();

    const pretty = line.match(/^\s*Prefix:\s*(.+)$/i);
    if (pretty) return pretty[1].trim();
  }

  return '';
}

function versionFromInstalledPath(path) {
  if (!path) return '';

  try {
    const version = hpcxVersionFromPath(realpathSync(path));
    if (version) return version;
  } catch {
    // Fall back to the reported path if it cannot be resolved.
  }

  return hpcxVersionFromPath(path);
}

export function nvhpcDefaultHpcxPaths(root) {
  const commLibs = dirname(root);
  const candidates = [join(commLibs, 'hpcx', 'latest')];

  try {
    for (const name of readdirSync(commLibs)) {
      candidates.push(join(commLibs, name, 'hpcx', 'latest'));
    }
  } catch {
    return [];
  }

  return candidates.filter((path) => existsSync(path));
}

async function detectHpcxVersion(wrapper, root) {
  const candidates = [process.env.HPCX_HOME];

  const wrapperResult = await execCapture(wrapper, ['--showme:incdirs']);
  if (wrapperResult.exitCode === 0) {
    candidates.push(
      ...wrapperResult.stdout
        .trim()
        .split(/\s+/)
        .map((path) => path.replace(/^["']|["']$/g, ''))
    );
  }

  try {
    const ompiInfo = await commandPath('ompi_info');
    const result = await execCapture(ompiInfo, [
      '--parsable',
      '--path',
      'prefix',
    ]);
    if (result.exitCode === 0) {
      candidates.push(openMpiPrefix(result.stdout));
    }
  } catch {
    // HPCX_HOME may still identify the active installation.
  }

  for (const candidate of candidates) {
    const version = versionFromInstalledPath(candidate);
    if (version) return version;
  }

  const defaultVersions = new Set(
    nvhpcDefaultHpcxPaths(root)
      .map(versionFromInstalledPath)
      .filter(Boolean)
  );
  if (defaultVersions.size === 1) {
    return [...defaultVersions][0];
  }

  return 'Unknown';
}

function hostedCpuEnvironment() {
  const environment = hostedRunnerUcxEnvironment('lin');
  const isHostedCpuRunner =
    process.env.RUNNER_ENVIRONMENT === 'github-hosted' &&
    !existsSync('/dev/nvidia0');

  if (!isHostedCpuRunner || process.env.UCX_WARN_UNUSED_ENV_VARS) {
    return environment;
  }

  info('Disabled irrelevant UCX GPU-variable warnings on this CPU-only hosted runner');
  return {
    ...environment,
    UCX_WARN_UNUSED_ENV_VARS: 'n',
  };
}

export async function setupHpcx({ mpiVersion }) {
  if (mpiVersion) {
    throw new Error(
      'mpi-version cannot be set for hpcx because NVIDIA HPC SDK supplies the matching MPI version.'
    );
  }

  const wrapper = await commandPath('mpifort');
  const root = dirname(dirname(wrapper));
  const version = await detectHpcxVersion(wrapper, root);
  info(`Detected HPC-X ${version}`);

  return createMpiDescriptor({
    implementation: 'hpcx',
    version,
    root,
    wrappers: {
      fortran: wrapper,
    },
    wrapperProbeArgs: ['--showme:command'],
    expectedFortranCompiler: 'nvfortran',
    environment: hostedCpuEnvironment(),
  });
}
