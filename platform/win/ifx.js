import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { existsSync, appendFileSync } from 'fs';
import { EOL } from 'os';
import { env } from 'process';

// 🛠 Run vcvars64.bat and export all env vars to process + GITHUB_ENV
async function runVcvars64() {
  let vsPath = '';

  await _exec('vswhere', [
    '-latest',
    '-products', '*',
    '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
    '-property', 'installationPath',
  ], {
    silent: true,
    listeners: {
      stdout: data => { vsPath += data.toString(); },
    }
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
    ignoreReturnCode: true,
    listeners: {
      stdout: data => { output += data.toString(); },
      stderr: data => { output += data.toString(); },
    }
  });
  endGroup();

  if (code !== 0) {
    throw new Error(`vcvars64.bat failed with code ${code}:\n${output}`);
  }

  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');

  output.split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=');
      env[key] = value;
      appendFileSync(envFile, `${key}=${value}${EOL}`);
    }
  });

  info('Exported MSVC environment to GITHUB_ENV');
}

// 🔍 Get conda environment prefix
async function getCondaPrefix(envName) {
  let raw = '';
  await _exec('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) },
  });
  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
  }
  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

// Main setup function
export async function setup() {
  await runVcvars64(); // 🛠 MSVC environment

  const packages = ['intel-fortran-rt', 'ifx_win-64'];

  startGroup('Conda install (Intel Fortran)');
  await _exec('conda', [
    'install',
    '--yes',
    '--name', 'fortran',
    '-c', 'https://software.repos.intel.com/python/conda/',
    '-c', 'conda-forge',
    ...packages
  ]);
  endGroup();

  const prefix = await getCondaPrefix('fortran');

  startGroup('Environment setup');
  addPath(join(prefix, 'bin'));
  addPath(join(prefix, 'Library', 'bin'));
  exportVariable('LIB', [
    join(prefix, 'Library', 'lib'),
    process.env.LIB || ''
  ].filter(Boolean).join(';'));
  endGroup();
}
