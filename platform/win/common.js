import { info } from '@actions/core';
import { exec as run } from '@actions/exec';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertPlatform, exportEnv, grouped } from '../common.js';

export * from '../common.js';

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
      const captured = [];
      const command = `""${vcvars}" >nul && "${process.execPath}" -p "JSON.stringify(process.env)""`;
      const exitCode = await run('cmd.exe', ['/d', '/s', '/c', command], {
        windowsVerbatimArguments: true,
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => {
            captured.push(data);
          },
        },
      });

      if (exitCode !== 0) {
        throw new Error(
          `vcvars64.bat failed with code ${exitCode}`
        );
      }
      info('vcvars64.bat ran successfully');
      try {
        return JSON.parse(Buffer.concat(captured).toString('utf8'));
      } catch {
        throw new Error('Unable to parse MSVC environment.');
      }
    }
  );

  await grouped('setup-fortran-conda: Export MSVC Environment', async () => {
    let exportedCount = 0;
    for (const [key, value] of Object.entries(output)) {
      if (process.env[key] === value) continue;

      exportEnv(key, value);
      info(`Exported: ${key}`);
      exportedCount += 1;
    }
    info(`MSVC environment loaded with ${exportedCount} variables`);
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
