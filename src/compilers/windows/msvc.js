import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { exportEnvironment, runInGroup } from '../../lib/action.js';

const MSVC_ENVIRONMENT_VARIABLES = Object.freeze([
  'PATH',
  'TMP',
  'INCLUDE',
  'LIB',
  'LIBPATH',
]);

async function commandExists(command) {
  try {
    await exec('where', [command], { silent: true });
    return true;
  } catch {
    return false;
  }
}

export function createMsvcCommandArguments(vcvarsPath) {
  const args = ['/d', '/c', 'call', vcvarsPath, '>nul'];
  for (const name of MSVC_ENVIRONMENT_VARIABLES) {
    args.push('&&', 'set', name);
  }
  return args;
}

function parseMsvcEnvironment(output) {
  const parsedValues = new Map();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).toUpperCase();
    if (!MSVC_ENVIRONMENT_VARIABLES.includes(key)) {
      continue;
    }
    parsedValues.set(key, line.slice(separator + 1));
  }

  const environment = {};
  for (const name of MSVC_ENVIRONMENT_VARIABLES) {
    const value = parsedValues.get(name);
    if (!value) {
      throw new Error(`vcvars64.bat did not define ${name}`);
    }
    environment[name] = value;
  }

  return environment;
}

export async function initializeMsvcEnvironment() {
  if (!(await commandExists('vswhere'))) {
    throw new Error(
      '"vswhere" not found in PATH. Ensure Visual Studio is installed.',
    );
  }

  const vcvarsPath = await runInGroup(
    'setup-fortran-conda: Detect Visual Studio Installation',
    async () => {
      let vsPath = '';
      await exec(
        'vswhere',
        [
          '-latest',
          '-products',
          '*',
          '-requires',
          'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
          '-property',
          'installationPath',
        ],
        {
          silent: true,
          listeners: {
            stdout: (data) => {
              vsPath += data.toString();
            },
          },
        },
      );

      vsPath = vsPath.trim();
      if (!vsPath) {
        throw new Error('vswhere did not return any installation path');
      }

      const resolvedPath = join(
        vsPath,
        'VC',
        'Auxiliary',
        'Build',
        'vcvars64.bat',
      );
      info(`Found Visual Studio: ${vsPath}`);
      info(`Resolved vcvars64.bat: ${resolvedPath}`);
      return resolvedPath;
    },
  );

  if (!existsSync(vcvarsPath)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvarsPath}`);
  }

  const output = await runInGroup(
    'setup-fortran-conda: Initialize MSVC Environment',
    async () => {
      let captured = '';
      const exitCode = await exec(
        'cmd.exe',
        createMsvcCommandArguments(vcvarsPath),
        {
          silent: true,
          ignoreReturnCode: true,
          listeners: {
            stdout: (data) => {
              captured += data.toString();
            },
            stderr: (data) => {
              captured += data.toString();
            },
          },
        },
      );

      if (exitCode !== 0) {
        throw new Error(
          `vcvars64.bat failed with code ${exitCode}:\n${captured}`,
        );
      }
      info('vcvars64.bat ran successfully');
      return captured;
    },
  );

  const environment = parseMsvcEnvironment(output);
  await exportEnvironment(
    environment,
    'setup-fortran-conda: Export MSVC Environment',
  );
  info(
    `MSVC environment loaded with ${Object.keys(environment).length} variables`,
  );
}
