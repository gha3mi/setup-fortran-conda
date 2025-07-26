import {
  startGroup,
  endGroup,
  addPath,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { existsSync } from 'fs';

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

export async function setup(version = '') {
  const flangPkg = version ? `flang=${version}` : 'flang';
  const packageName = [flangPkg, 'binutils'];

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
  const binPath = join(prefix, 'bin');
  const libBinPath = join(prefix, 'Library', 'bin');

  if (existsSync(binPath)) addPath(binPath);
  if (existsSync(libBinPath)) addPath(libBinPath);
  endGroup();

}
