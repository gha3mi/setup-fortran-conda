import { addPath, endGroup, info, startGroup } from '@actions/core';
import { exec as run } from '@actions/exec';
import { appendFileSync, existsSync } from 'node:fs';
import { EOL } from 'node:os';
import { sep } from 'node:path';

export const TOOLS_ENVIRONMENT = 'fortran';

export function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

export async function grouped(name, operation) {
  startGroup(name);
  try {
    return await operation();
  } finally {
    endGroup();
  }
}

export function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');

  const normalized = String(value);
  appendFileSync(envFile, `${key}=${normalized}${EOL}`);
  process.env[key] = normalized;
}

export function compilerEnvironment(fortran, c, cxx, extra = {}) {
  return {
    FC: fortran,
    CC: c,
    CXX: cxx,
    FPM_FC: fortran,
    FPM_CC: c,
    FPM_CXX: cxx,
    CMAKE_Fortran_COMPILER: fortran,
    CMAKE_C_COMPILER: c,
    CMAKE_CXX_COMPILER: cxx,
    ...extra,
  };
}

export async function exportCompilerEnvironment(values) {
  await grouped('setup-fortran-conda: Export Compiler Environment', async () => {
    for (const [key, value] of Object.entries(values)) {
      exportEnv(key, value);
      info(`Exported: ${key}=${value}`);
    }
  });
}

export async function exportProcessEnvironment({ warningPrefix = '⚠️ ' } = {}) {
  await grouped('setup-fortran-conda: Export Process Environment', async () => {
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value !== 'string') continue;

      try {
        process.env[key] = value;
        appendFileSync(process.env.GITHUB_ENV, `${key}=${value}${EOL}`);
        info(`Exported: ${key}`);
      } catch (error) {
        info(`${warningPrefix}Failed to export: ${key} (${error.message})`);
      }
    }
  });
}

export async function getCondaPrefix(
  envName = TOOLS_ENVIRONMENT,
  required = true
) {
  let output = '';
  await run('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
    },
  });

  const { envs = [] } = JSON.parse(output);
  const prefix = envs.find(
    (candidate) =>
      candidate.endsWith(sep + envName) || candidate.endsWith('/' + envName)
  );

  if (!prefix && required) {
    throw new Error(`Unable to locate Conda environment "${envName}".`);
  }
  return prefix || '';
}

export async function installCondaPackages(
  packages,
  {
    envName = TOOLS_ENVIRONMENT,
    channels = ['conda-forge'],
    command = 'install',
    commandOptions = [],
    successMessage = 'Conda packages installed',
    errorMessage = 'Conda install failed',
  } = {}
) {
  await grouped('setup-fortran-conda: Install Conda Packages', async () => {
    try {
      const args = [
        command,
        ...commandOptions,
        '--yes',
        '--name',
        envName,
        ...packages,
      ];
      for (const channel of channels) args.push('-c', channel);

      await run('conda', args);
      info(successMessage);
    } catch (error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  });
}

export async function showCondaEnvironment(envNames = [TOOLS_ENVIRONMENT]) {
  await grouped('setup-fortran-conda: Show Conda Environment', async () => {
    await run('conda', ['info']);
    for (const envName of envNames) {
      await run('conda', ['list', '--name', envName]);
    }
  });
}

export async function addExistingPaths(paths, { log = true } = {}) {
  await grouped('setup-fortran-conda: Configure Compiler Paths', async () => {
    for (const path of paths) {
      if (!path || !existsSync(path)) continue;

      addPath(path);
      if (log) info(`Added to PATH: ${path}`);
    }
  });
}

export async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await grouped('setup-fortran-conda: Verify Compiler Commands', async () => {
    for (const { command, args } of commands) {
      await run(lookupCommand, [command]);
      if (args) await run(command, args);
    }
  });
}
