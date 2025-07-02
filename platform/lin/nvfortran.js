import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
  setFailed,
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
  const ulimitCmd =
    'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
  appendFileSync(process.env.GITHUB_ENV, `BASH_ENV=${process.env.RUNNER_TEMP}/ulimit.sh${EOL}`);
  appendFileSync(`${process.env.RUNNER_TEMP}/ulimit.sh`, `${ulimitCmd}${EOL}`);
  endGroup();
}

export async function setup(version = '25.5') {
  version = version?.trim() || '25.5';
  const arch = 'Linux_x86_64';
  const base = '/opt/nvidia/hpc_sdk';

  try {
    startGroup('Install NVIDIA HPC SDK');
    await _exec('sudo', [
      'bash',
      '-c',
      'curl -fsSL https://developer.download.nvidia.com/hpc-sdk/ubuntu/DEB-GPG-KEY-NVIDIA-HPC-SDK | gpg --dearmor -o /usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg',
    ]);
    await _exec('sudo', [
      'bash',
      '-c',
      `echo 'deb [signed-by=/usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg] https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64 /' > /etc/apt/sources.list.d/nvhpc.list`,
    ]);
    await _exec('sudo', ['apt-get', 'update', '-y']);
    await _exec('sudo', ['apt-get', 'install', '-y', `nvhpc-${version.replace(/\./g, '-')}`]);
    endGroup();

    startGroup('Environment setup');

    exportVariable('NVHPC', base);

    addPath(join(base, arch, version, 'compilers', 'bin'));
    addPath(join(base, arch, version, 'comm_libs', 'mpi', 'bin'));

    const libPath = [
      join(base, arch, version, 'compilers', 'lib'),
      join(base, arch, version, 'comm_libs', 'mpi', 'lib'),
      process.env.LD_LIBRARY_PATH || '',
    ]
      .filter(Boolean)
      .join(':');

    exportVariable('LD_LIBRARY_PATH', libPath);
    info(`LD_LIBRARY_PATH → ${libPath}`);
    endGroup();


    const prefix = await getCondaPrefix('fortran');
    startGroup('Add fpm to PATH');
    addPath(join(prefix, 'bin'));
    info(`Added ${join(prefix, 'bin')} to PATH`);
    endGroup();

    await setUlimits();
  } catch (err) {
    setFailed(`NVHPC setup failed: ${err.message}`);
  }
}
