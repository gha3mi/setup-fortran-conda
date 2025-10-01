import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { appendFileSync, existsSync } from 'fs';
import { EOL } from 'os';
import { env, platform } from 'process';

// Export a key=value pair to GITHUB_ENV and process.env
function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  appendFileSync(envFile, `${key}=${value}${EOL}`);
  env[key] = value;
}

// Resolve the absolute path of a named conda environment
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

// Optional: Set unlimited ulimits for Linux
function setLinuxUlimits() {
  startGroup('Setting unlimited ulimits (Linux)');
  const ulimitCmd =
    'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
  const script = `${process.env.RUNNER_TEMP}/ulimit.sh`;
  appendFileSync(script, `${ulimitCmd}${EOL}`);
  appendFileSync(process.env.GITHUB_ENV, `BASH_ENV=${script}${EOL}`);
  info('ulimit settings exported to BASH_ENV');
  endGroup();
}

// Free up disk space
async function freeUpDiskSpace() {
  startGroup('Freeing disk space');
  await _exec('sudo', ['rm', '-rf', '/usr/local/lib/android', '/usr/local/android-sdk', '/usr/share/dotnet']);
  endGroup();
}

// Main setup function
export async function setup(version = '25.7') {
  if (platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  await freeUpDiskSpace();

  version = version?.trim() || '25.7';

  // Install NVIDIA HPC SDK via apt
  startGroup('Installing NVIDIA HPC SDK');
  try {
    await _exec('sudo', [
      'bash', '-c',
      'curl -fsSL https://developer.download.nvidia.com/hpc-sdk/ubuntu/DEB-GPG-KEY-NVIDIA-HPC-SDK | gpg --dearmor -o /usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg'
    ]);
    await _exec('sudo', [
      'bash', '-c',
      `echo 'deb [signed-by=/usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg] https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64 /' > /etc/apt/sources.list.d/nvhpc.list`
    ]);
    await _exec('sudo', ['apt-get', 'update', '-y']);
    await _exec('sudo', ['apt-get', 'install', '-y', `nvhpc-${version.replace(/\./g, '-')}`]);
    info('NVIDIA HPC SDK installed');
  } catch (err) {
    throw new Error(`NVIDIA HPC SDK install failed: ${err.message}`);
  }
  endGroup();

  const base = '/opt/nvidia/hpc_sdk';
  const arch = 'Linux_x86_64';
  const binComp = join(base, arch, version, 'compilers', 'bin');
  const binMPI = join(base, arch, version, 'comm_libs', 'mpi', 'bin');
  const libComp = join(base, arch, version, 'compilers', 'lib');
  const libMPI = join(base, arch, version, 'comm_libs', 'mpi', 'lib');

  // Conda path
  const prefix = await getCondaPrefix('fortran');
  const condaBin = join(prefix, 'bin');

  // Add all relevant bin directories to PATH
  startGroup('Setting up environment paths');
  const paths = [binComp, binMPI, condaBin];
  for (const p of paths) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  // Verify that the compilers are installed and working
  startGroup('Verifying compiler versions');
  await _exec('which', ['nvfortran']);
  await _exec('nvfortran', ['--version']);
  await _exec('which', ['nvc']);
  await _exec('nvc', ['--version']);
  await _exec('which', ['nvc++']);
  await _exec('nvc++', ['--version']);
  endGroup();

  // Export compiler-related environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'nvfortran',
    CC: 'nvc',
    CXX: 'nvc++',
    FPM_FC: 'nvfortran',
    FPM_CC: 'nvc',
    FPM_CXX: 'nvc++',
    CMAKE_Fortran_COMPILER: 'nvfortran',
    CMAKE_C_COMPILER: 'nvc',
    CMAKE_CXX_COMPILER: 'nvc++',
    LD_LIBRARY_PATH: [libComp, libMPI, env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':'),
    NVHPC: base
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  setLinuxUlimits();

  startGroup('Exporting all environment variables to process.env and GITHUB_ENV');
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      try {
        process.env[key] = value;
        appendFileSync(process.env.GITHUB_ENV, `${key}=${value}${EOL}`);
        info(`Exported: ${key}`);
      } catch (err) {
        info(`⚠️ Failed to export: ${key} (${err.message})`);
      }
    }
  }
  endGroup();

  info('✅ compiler setup complete');
}
