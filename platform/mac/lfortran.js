import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';

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

async function setMacOSSDKROOT() {
  let sdkPath = '';
  await _exec('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: { stdout: d => (sdkPath += d.toString()) },
  });
  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportVariable('SDKROOT', sdkPath);
    info(`Set SDKROOT → ${sdkPath}`);
  } else {
    info('Failed to detect macOS SDK path.');
  }
}

export async function setup() {
  const packageName = ['git','lfortran'];

  startGroup('Conda install');
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    'fortran',
    ...packageName,
    '-c',
    'conda-forge',
  ]);
  endGroup();

  const prefix = await getCondaPrefix('fortran');

  startGroup('Environment setup');
  addPath(join(prefix, 'bin'));

  const newDyld = `${join(prefix, 'lib')}:${process.env.DYLD_LIBRARY_PATH || ''}`;
  exportVariable('DYLD_LIBRARY_PATH', newDyld);
  info(`DYLD_LIBRARY_PATH → ${newDyld}`);

  await setMacOSSDKROOT();
  endGroup();

}
