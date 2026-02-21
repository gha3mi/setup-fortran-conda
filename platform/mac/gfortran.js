import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { appendFileSync, existsSync, readdirSync } from 'fs';
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

// Set macOS SDK path for compiler compatibility
async function setMacOSSDKROOT() {
  let sdkPath = '';
  await _exec('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: { stdout: d => (sdkPath += d.toString()) }
  });

  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportEnv('SDKROOT', sdkPath);
    info(`Set SDKROOT → ${sdkPath}`);
  } else {
    info('⚠️ Failed to detect macOS SDK path.');
  }
}

// Detect the latest Homebrew GCC version (e.g., gcc-13, gcc-14, etc.)
function detectHomebrewGccVersion() {
  const binDir = '/opt/homebrew/bin';
  const gccVersions = readdirSync(binDir)
    .filter(f => f.startsWith('gcc-'))
    .map(f => parseInt(f.replace('gcc-', '')))
    .filter(Number.isFinite);
  const latest = Math.max(...gccVersions);
  return `gcc-${latest}`;
}

// Main setup function
export async function setup(version = '') {
  if (platform !== 'darwin') {
    throw new Error('This setup script is only supported on macOS.');
  }

  // Install Homebrew GCC
  let gcc = '';
  let gpp = '';
  let major = '';

  startGroup('Installing GCC via Homebrew');
  try {
    if (version) {
      major = version.split('.')[0];
      await _exec('brew', ['install', `gcc@${major}`]);
      info(`Homebrew gcc@${major} installed`);
      gcc = `gcc-${major}`;
      gpp = `g++-${major}`;
    } else {
      await _exec('brew', ['install', 'gcc']);
      info('Homebrew latest gcc installed');
      gcc = detectHomebrewGccVersion();       // e.g., "gcc-14"
      gpp = gcc.replace('gcc', 'g++');        // e.g., "g++-14"
      major = gcc.split('-')[1];              // extract "14" from "gcc-14"
    }
  } catch (err) {
    throw new Error(`Homebrew gcc install failed: ${err.message}`);
  }
  endGroup();

  // Install gfortran via Conda
  const Pkg = version ? `gfortran=${version}` : 'gfortran';
  const packages = [Pkg, 'binutils'];

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

  // Add Conda bin path to PATH
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

  await setMacOSSDKROOT();

  // Verify compiler versions
  startGroup('Verifying compiler versions');
  await _exec('which', ['gfortran']);
  await _exec('gfortran', ['--version']);
  await _exec('which', [gcc]);
  await _exec(gcc, ['--version']);
  await _exec('which', [gpp]);
  await _exec(gpp, ['--version']);
  endGroup();

  // Export compiler-related environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'gfortran',
    CC: gcc,
    CXX: gpp,
    FPM_FC: 'gfortran',
    FPM_CC: gcc,
    FPM_CXX: gpp,
    CMAKE_Fortran_COMPILER: 'gfortran',
    CMAKE_C_COMPILER: gcc,
    CMAKE_CXX_COMPILER: gpp
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  // Export all environment variables to process.env and GITHUB_ENV
  startGroup('Exporting all environment variables to process.env and GITHUB_ENV');
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      try {
        process.env[key] = value;
        appendFileSync(process.env.GITHUB_ENV, `${key}=${value}${EOL}`);
        info(`Exported: ${key}`);
      } catch (err) {
        info(`Failed to export: ${key} (${err.message})`);
      }
    }
  }
  endGroup();

  info('✅ compiler setup complete');
}
