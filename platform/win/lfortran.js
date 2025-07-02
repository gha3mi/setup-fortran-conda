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
import { env, platform } from 'process';

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

  info('✅ Exported MSVC environment to GITHUB_ENV');
}

export async function setup(version = '') {
  const lfortranPkg = version ? `lfortran=${version}` : 'lfortran';
  const packages = [lfortranPkg, 'llvm'];

  startGroup('Conda install (LFortran + LLVM)');
  await _exec('conda', [
    'install',
    '--yes',
    '--name', 'fortran',
    '-c', 'conda-forge',
    ...packages
  ]);
  endGroup();

  startGroup('Environment setup');
  const prefix = await getCondaPrefix('fortran');

  if (platform === 'win32') {
    await runVcvars64();
    exportVariable('LFORTRAN_LINKER', 'link');
    info('🔗 Using MSVC linker (link.exe)');
  } else {
    exportVariable('LFORTRAN_LINKER', 'gcc');
    info('🔗 Using GCC linker');
  }

  const binPath = join(prefix, 'bin');
  const libBinPath = join(prefix, 'Library', 'bin');
  const usrBinPath = join(prefix, 'Library', 'usr', 'bin');
  const scriptsPath = join(prefix, 'Scripts');

  addPath(scriptsPath);
  addPath(usrBinPath);
  addPath(libBinPath);
  addPath(binPath);

  if (platform === 'win32') {
    exportVariable('LIB', [
      join(prefix, 'Library', 'lib'),
      env.LIB || ''
    ].filter(Boolean).join(';'));
  }
  endGroup();
}
