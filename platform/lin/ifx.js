import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { appendFileSync, existsSync } from 'fs';
import { EOL } from 'os';
import { env, platform } from 'process';

// Export a key=value pair to GitHub Actions' environment and current process.env
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

// Main setup function
export async function setup(version = '') {
  if (platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  // Define Conda packages
  const packages = [
    version ? `ifx_linux-64=${version}` : 'ifx_linux-64',
    version ? `intel-fortran-rt=${version}` : 'intel-fortran-rt',
    version ? `dpcpp-cpp-rt=${version}` : 'dpcpp-cpp-rt',
    version ? `dpcpp_linux-64=${version}` : 'dpcpp_linux-64',
    version ? `intel-sycl-rt=${version}` : 'intel-sycl-rt',
    'llvm-openmp'
  ];

  // Install required compilers and tools via Conda
  startGroup('Installing Conda packages');
  try {
    await _exec('conda', [
      'install',
      '--yes',
      '--name',
      'fortran',
      ...packages,
      '-c', 'https://software.repos.intel.com/python/conda/',
      '-c', 'conda-forge',
      '--update-all',
      '--all',
      '--force-reinstall'
    ]);
    info('Conda packages installed');
  } catch (err) {
    throw new Error(`Conda install failed: ${err.message}`);
  }
  endGroup();

  // Conda environment information
  startGroup('Conda environment information');
  await _exec('conda', ['info']);
  await _exec('conda', ['list', '--name', 'fortran']);
  endGroup();

  // Add Conda bin path to PATH
  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');

  startGroup('Setting up environment paths');
  if (existsSync(binPath)) {
    addPath(binPath);
    info(`Added to PATH: ${binPath}`);
  }
  endGroup();

  // Verify that the compilers are installed and working
  startGroup('Verifying compiler versions');
  await _exec('which', ['ifx']);
  await _exec('ifx', ['--version']);
  await _exec('which', ['icx']);
  await _exec('icx', ['--version']);
  endGroup();

  // Export compiler-related environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'ifx',
    CC: 'icx',
    CXX: 'icx',
    FPM_FC: 'ifx',
    FPM_CC: 'icx',
    FPM_CXX: 'icx',
    CMAKE_Fortran_COMPILER: 'ifx',
    CMAKE_C_COMPILER: 'icx',
    CMAKE_CXX_COMPILER: 'icx',
    LD_LIBRARY_PATH: [join(prefix, 'lib'), env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':')
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  setLinuxUlimits();

  // Export all env variables to GITHUB_ENV and process.env
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

  // Final success message
  info('✅ compiler setup complete');
}
