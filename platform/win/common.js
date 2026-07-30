import { info } from '@actions/core';
import { exec as run } from '@actions/exec';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertPlatform, exportEnv, grouped } from '../common.js';

export * from '../common.js';

const MSVC_ENVIRONMENT_VARIABLES = Object.freeze([
  'PATH',
  'TMP',
  'INCLUDE',
  'LIB',
  'LIBPATH',
]);

export function assertWindows() {
  assertPlatform('win32', 'This setup script is only supported on Windows.');
}

async function commandExists(command) {
  try {
    await run('where', [command], { silent: true });
    return true;
  } catch {
    return false;
  }
}

export async function initializeMsvcEnvironment() {
  if (!(await commandExists('vswhere'))) {
    throw new Error(
      '"vswhere" not found in PATH. Ensure Visual Studio is installed.'
    );
  }

  const vcvars = await grouped(
    'setup-fortran-conda: Detect Visual Studio Installation',
    async () => {
      let vsPath = '';
      await run(
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
        }
      );

      vsPath = vsPath.trim();
      if (!vsPath) {
        throw new Error('vswhere did not return any installation path');
      }

      const path = join(vsPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
      info(`Found Visual Studio: ${vsPath}`);
      info(`Resolved vcvars64.bat: ${path}`);
      return path;
    }
  );

  if (!existsSync(vcvars)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvars}`);
  }

  const output = await grouped(
    'setup-fortran-conda: Initialize MSVC Environment',
    async () => {
      let captured = '';
      const command =
        `call "${vcvars}" >nul && ` +
        '(set PATH&set TMP&set INCLUDE&set LIB&set LIBPATH)';
      const exitCode = await run('cmd.exe', ['/d', '/c', command], {
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
      });

      if (exitCode !== 0) {
        throw new Error(
          `vcvars64.bat failed with code ${exitCode}:\n${captured}`
        );
      }
      info('vcvars64.bat ran successfully');
      return captured;
    }
  );

  await grouped('setup-fortran-conda: Export MSVC Environment', async () => {
    const values = new Map();
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim();
      const separator = line.indexOf('=');
      if (separator <= 0) continue;

      const key = line.slice(0, separator).toUpperCase();
      if (!MSVC_ENVIRONMENT_VARIABLES.includes(key)) continue;
      values.set(key, line.slice(separator + 1));
    }

    for (const required of MSVC_ENVIRONMENT_VARIABLES) {
      if (!values.get(required)) {
        throw new Error(`vcvars64.bat did not define ${required}`);
      }
    }

    for (const key of MSVC_ENVIRONMENT_VARIABLES) {
      const value = values.get(key);
      if (value == null) continue;
      exportEnv(key, value);
      info(`Exported: ${key}`);
    }
    info(`MSVC environment loaded with ${values.size} variables`);
  });
}

export function windowsCondaPaths(prefix) {
  return [
    join(prefix, 'bin'),
    join(prefix, 'Library', 'bin'),
    join(prefix, 'Library', 'usr', 'bin'),
    join(prefix, 'Scripts'),
  ];
}
