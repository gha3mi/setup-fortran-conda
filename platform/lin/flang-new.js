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
    listeners: { stdout: (d) => (raw += d.toString()) }
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

  // Define the set of Conda packages to install
  const Pkg = version ? `flang=${version}` : 'flang';
  const packages = [Pkg, 'llvm', 'clang-tools', 'llvm-openmp', 'lld'];

  startGroup('Installing Conda packages');
  try {
    await _exec('conda', [
      'install',
      '--yes',
      '--name',
      'fortran',
      ...packages,
      '-c',
      'conda-forge',
      '--update-all',
      '--all',
      '--force-reinstall'
    ]);
    info('Conda packages installed');
  } catch (err) {
    throw new Error(`Conda install failed: ${err.message}`);
  }
  endGroup();

  // Add Conda bin paths to PATH so tools are usable
  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');
  const libPath = join(prefix, 'lib');

  startGroup('Setting up environment paths');
  const paths = [binPath];
  for (const p of paths) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  // Set LD_LIBRARY_PATH
  const ldPath = [libPath, env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':');
  exportEnv('LD_LIBRARY_PATH', ldPath);
  info(`Set LD_LIBRARY_PATH → ${ldPath}`);

  // Verify that the compilers are installed and working
  startGroup('Verifying compiler versions');
  await _exec('which', ['flang']);
  await _exec('flang', ['--version']);
  await _exec('which', ['clang']);
  await _exec('clang', ['--version']);
  await _exec('which', ['clang++']);
  await _exec('clang++', ['--version']);
  endGroup();

  // Export compiler-related environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'flang',
    CC: 'clang',
    CXX: 'clang++',
    FPM_FC: 'flang',
    FPM_CC: 'clang',
    FPM_CXX: 'clang++',
    CMAKE_Fortran_COMPILER: 'flang',
    CMAKE_C_COMPILER: 'clang',
    CMAKE_CXX_COMPILER: 'clang++',
    LD_LIBRARY_PATH: ldPath
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  setLinuxUlimits();

  // Export all environment variables to process.env and GITHUB_ENV
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
