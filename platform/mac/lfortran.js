import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { appendFileSync, existsSync } from 'fs';
import { EOL } from 'os';
import { env, platform } from 'process';

// Export a key=value pair to GitHub Actions' environment and process.env
function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  appendFileSync(envFile, `${key}=${value}${EOL}`);
  env[key] = value;
}

// Check if a given command exists
async function commandExists(cmd) {
  try {
    await _exec('which', [cmd], { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Get full path to a conda environment
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

// Get macOS SDK path (used by compilers/linkers)
async function setMacOSSDKROOT() {
  let sdkPath = '';
  await _exec('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: { stdout: d => (sdkPath += d.toString()) },
  });
  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportEnv('SDKROOT', sdkPath);
    info(`Set SDKROOT → ${sdkPath}`);
  } else {
    info('⚠️ Failed to detect macOS SDK path.');
  }
}

// Main setup function
export async function setup(version = '') {
  if (platform !== 'darwin') {
    throw new Error('This setup script is only supported on macOS.');
  }

  // Define the set of Conda packages to install
  const Pkg = version ? `lfortran=${version}` : 'lfortran';
  const packages = [Pkg, 'llvm', 'clangxx', 'clang-tools', 'llvm-openmp', 'lld', 'git'];

  // Install required compilers and tools via Conda
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

  // Set environment paths
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

  const dyldLibPath = [libPath, process.env.DYLD_LIBRARY_PATH || ''].filter(Boolean).join(':');
  exportEnv('DYLD_LIBRARY_PATH', dyldLibPath);
  info(`Set DYLD_LIBRARY_PATH → ${dyldLibPath}`);
  endGroup();

  // Set macOS SDK path
  await setMacOSSDKROOT();

  // Verify compilers are installed
  startGroup('Verifying compiler versions');
  await _exec('which', ['lfortran']);
  await _exec('lfortran', ['--version']);
  await _exec('which', ['clang']);
  await _exec('clang', ['--version']);
  await _exec('which', ['clang++']);
  await _exec('clang++', ['--version']);
  endGroup();

  // Export environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'lfortran',
    CC: 'clang',
    CXX: 'clang++',
    FPM_FC: 'lfortran',
    FPM_CC: 'clang',
    FPM_CXX: 'clang++',
    CMAKE_Fortran_COMPILER: 'lfortran',
    CMAKE_C_COMPILER: 'clang',
    CMAKE_CXX_COMPILER: 'clang++'
    // DYLD_LIBRARY_PATH: dyldLibPath,
    // LFORTRAN_LINKER: '/Users/runner/miniconda3/envs/fortran/bin/clang'
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  // Export all to process.env and GITHUB_ENV
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
