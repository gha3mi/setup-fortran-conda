import {
  addPath,
  endGroup,
  exportVariable,
  info,
  startGroup,
} from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync } from 'node:fs';

const RESERVED_ENVIRONMENT_NAME = /^(?:GITHUB_|RUNNER_)/i;

export async function runInGroup(name, operation) {
  startGroup(name);
  try {
    return await operation();
  } finally {
    endGroup();
  }
}

export function exportEnvironmentVariable(key, value) {
  if (value === null || value === undefined) {
    return;
  }

  const name = String(key);
  const upperName = name.toUpperCase();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid environment variable name: ${name}`);
  }
  if (RESERVED_ENVIRONMENT_NAME.test(name) || upperName === 'NODE_OPTIONS') {
    throw new Error(
      `Refusing to export reserved environment variable: ${name}`,
    );
  }
  if (!process.env.GITHUB_ENV) {
    throw new Error('GITHUB_ENV not defined');
  }

  exportVariable(name, String(value));
}

export function exportEnvironmentVariables(values, { skipEmpty = false } = {}) {
  for (const [key, value] of Object.entries(values)) {
    if (skipEmpty && !value) {
      continue;
    }

    exportEnvironmentVariable(key, value);
    info(`Exported: ${key}`);
  }
}

export async function exportEnvironment(
  values,
  groupName = 'setup-fortran-conda: Export Environment',
) {
  await runInGroup(groupName, async () => {
    exportEnvironmentVariables(values);
  });
}

export async function addExistingPaths(paths, { log = true } = {}) {
  await runInGroup(
    'setup-fortran-conda: Configure Compiler Paths',
    async () => {
      for (const pathEntry of paths) {
        if (!pathEntry || !existsSync(pathEntry)) {
          continue;
        }

        addPath(pathEntry);
        if (log) {
          info(`Added to PATH: ${pathEntry}`);
        }
      }
    },
  );
}

export async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await runInGroup(
    'setup-fortran-conda: Verify Compiler Commands',
    async () => {
      for (const { command, args } of commands) {
        await exec(lookupCommand, [command]);
        if (args) {
          await exec(command, args);
        }
      }
    },
  );
}
