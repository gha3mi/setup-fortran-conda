import {
  startGroup,
  endGroup,
  info,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import {
  existsSync,
  appendFileSync,
  readdirSync,
} from 'fs';
import { EOL } from 'os';
import { env } from 'process';

// Run vcvars64.bat and export all env vars to process + GITHUB_ENV
async function runVcvars64() {
  let vsPath = '';

  await _exec('vswhere', [
    '-latest',
    '-products', '*',
    '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
    '-property', 'installationPath',
  ], {
    silent: true,
    listeners: { stdout: data => { vsPath += data.toString(); } }
  });

  vsPath = vsPath.trim();
  if (!vsPath) throw new Error('vswhere did not return any installation path');

  const vcvars = join(vsPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  info(`🛠 Found Visual Studio: ${vsPath}`);
  info(`🔧 Resolved vcvars64.bat: ${vcvars}`);

  if (!existsSync(vcvars)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvars}`);
  }

  startGroup('Running vcvars64.bat');
  let output = '';
  const code = await _exec('cmd.exe', ['/c', vcvars, '&&', 'set'], {
    silent: true,
    listeners: {
      stdout: data => { output += data.toString(); },
      stderr: data => { output += data.toString(); },
    },
  });
  endGroup();

  if (code !== 0) {
    throw new Error(`vcvars64.bat failed with code ${code}:\n${output}`);
  }

  const envFile = process.env.GITHUB_ENV;
  output.split(/\r?\n/).forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=');
      env[key] = value;
      appendFileSync(envFile, `${key}=${value}${EOL}`);
    }
  });

  info('✔ MSVC environment exported');
}

// Get conda environment prefix
async function getCondaPrefix(envName) {
  let raw = '';
  await _exec('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });
  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
  }
  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

// Activate and export Conda env on Windows
async function exportActivatedCondaEnvWindows(envName) {
  startGroup(`Activating Conda env: ${envName}`);

  let output = '';
  const code = await _exec('cmd.exe', [
    '/c',
    `call conda.bat activate ${envName} && set`
  ], {
    silent: true,
    listeners: {
      stdout: data => { output += data.toString(); },
      stderr: data => { output += data.toString(); },
    }
  });

  endGroup();

  if (code !== 0) {
    throw new Error(`Failed to activate Conda env "${envName}"`);
  }

  const envFile = process.env.GITHUB_ENV;
  output.split(/\r?\n/).forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=');
      env[key] = value;
      appendFileSync(envFile, `${key}=${value}${EOL}`);
    }
  });

  info(`✔ Conda environment "${envName}" exported`);

  // Run all .bat activation hooks from <env>\etc\conda\activate.d\
  const condaPrefix = env.CONDA_PREFIX;
  if (!condaPrefix) {
    throw new Error('CONDA_PREFIX not set after activation');
  }

  const activateDir = join(condaPrefix, 'etc', 'conda', 'activate.d');
  if (existsSync(activateDir)) {
    const hookScripts = readdirSync(activateDir).filter(f => f.endsWith('.bat'));

    startGroup('Running activation hook scripts');
    for (const script of hookScripts) {
      const scriptPath = join(activateDir, script);
      info(`🔁 Running: ${scriptPath}`);
      let hookOutput = '';
      const exitCode = await _exec('cmd.exe', ['/c', `call "${scriptPath}" && set`], {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: d => hookOutput += d.toString(),
          stderr: d => hookOutput += d.toString(),
        }
      });

      if (exitCode !== 0) {
        info(`⚠️ Script failed: ${scriptPath} (exit code ${exitCode})`);
        info(hookOutput);
        continue;
      }

      hookOutput.split(/\r?\n/).forEach(line => {
        const [key, ...rest] = line.trim().split('=');
        if (key && rest.length > 0) {
          const value = rest.join('=');
          env[key] = value;
          appendFileSync(envFile, `${key}=${value}${EOL}`);
        }
      });
    }
    endGroup();

    info('✔ All activation hook scripts processed');
  } else {
    info(`ℹ No activation hook directory found at ${activateDir}`);
  }
}

// Main setup entrypoint
export async function setup(version = '') {
    throw new Error("Compiler 'mpifort' is not supported on windows.");
}
