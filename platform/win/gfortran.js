import {
  startGroup,
  endGroup,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { appendFileSync } from 'fs';
import { EOL } from 'os';

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
  const gfortranPkg = version ? `gfortran=${version}` : 'gfortran';
  const packageName = [gfortranPkg, 'binutils'];

  startGroup('Conda install');
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    'fortran',
    '-c',
    'conda-forge',
    ...packageName,
  ]);
  endGroup();

  startGroup('Environment setup');
  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');
  const libBinPath = join(prefix, 'Library', 'bin');
  const usrBinPath = join(prefix, 'Library', 'usr', 'bin');
  const scriptsPath = join(prefix, 'Scripts');

  const systemPaths = [
    'C:\\Windows\\system32',
    'C:\\Windows',
    'C:\\Windows\\System32\\Wbem',
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\',
    'C:\\Windows\\System32\\OpenSSH\\',
    'C:\\Program Files\\Git\\cmd'
  ];

  const pathDelimiter = process.platform === 'win32' ? ';' : ':';

  const safePath = [
    scriptsPath,
    usrBinPath,
    libBinPath,
    binPath,
    ...systemPaths,
  ].join(pathDelimiter);

  process.env.PATH = safePath;
  appendFileSync(process.env.GITHUB_ENV, `PATH=${safePath}${EOL}`);
  endGroup();
}
