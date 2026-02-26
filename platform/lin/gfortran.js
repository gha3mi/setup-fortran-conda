import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { existsSync, appendFileSync } from 'fs';
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

// Main setup function
export async function setup(version = '') {
  if (platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  // Define the Conda packages to install
  const packages = [
    version ? `gfortran=${version}` : 'gfortran',
    version ? `gcc_linux-64=${version}` : 'gcc_linux-64',
    version ? `gxx=${version}` : 'gxx',
    'binutils'
  ];

  startGroup('Installing Conda packages');
  try {
    await _exec('conda', [
      'install',
      '--yes',
      '--name',
      'fortran',
      ...packages,
      '-c',
      'conda-forge'
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

  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');

  startGroup('Setting up environment paths');
  if (existsSync(binPath)) {
    addPath(binPath);
    info(`Added to PATH: ${binPath}`);
  }
  endGroup();

  startGroup('Verifying compiler versions');
  await _exec('which', ['gfortran']);
  await _exec('gfortran', ['--version']);
  await _exec('which', ['gcc']);
  await _exec('gcc', ['--version']);
  await _exec('which', ['g++']);
  await _exec('g++', ['--version']);
  endGroup();

  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'gfortran',
    CC: 'gcc',
    CXX: 'g++',
    FPM_FC: 'gfortran',
    FPM_CC: 'gcc',
    FPM_CXX: 'g++',
    CMAKE_Fortran_COMPILER: 'gfortran',
    CMAKE_C_COMPILER: 'gcc',
    CMAKE_CXX_COMPILER: 'g++',
    LD_LIBRARY_PATH: [join(prefix, 'lib'), process.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':')
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
