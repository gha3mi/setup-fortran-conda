import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
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

async function setUlimits() {
  if (process.platform !== 'linux') return;

  startGroup('Set unlimited ulimits (Linux, persistent)');
  const ulimitCmd = 'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';

  // Inject into bash shell for all future steps
  appendFileSync(process.env.GITHUB_ENV, `BASH_ENV=${process.env.RUNNER_TEMP}/ulimit.sh${EOL}`);
  appendFileSync(`${process.env.RUNNER_TEMP}/ulimit.sh`, `${ulimitCmd}${EOL}`);

  endGroup();
}

export async function setup() {
  const packageName = 'ifx_linux-64';

  startGroup('Conda install');
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    'fortran',
    packageName,
    '-c',
    'conda-forge',
  ]);
  endGroup();

  const prefix = await getCondaPrefix('fortran');

  startGroup('Environment setup');
  addPath(join(prefix, 'bin'));

  const newLd = `${join(prefix, 'lib')}:${process.env.LD_LIBRARY_PATH || ''}`;
  exportVariable('LD_LIBRARY_PATH', newLd);
  info(`LD_LIBRARY_PATH → ${newLd}`);
  endGroup();

  await setUlimits();

}
