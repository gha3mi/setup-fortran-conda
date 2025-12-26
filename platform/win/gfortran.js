import { startGroup, endGroup, addPath, info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { existsSync, appendFileSync } from 'fs';
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

// Main setup function to configure compilers and environment
export async function setup(version = '') {
  // Ensure this only runs on Windows
  if (platform !== 'win32') {
    throw new Error('This setup script is only supported on Windows.');
  }

  // Define the set of Conda packages to install
  const packages = [
    version ? `gfortran=${version}` : 'gfortran',
    version ? `gcc=${version}` : 'gcc',
    version ? `gxx=${version}` : 'gxx',
    'binutils'
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

  // Conda environment information
  startGroup('Conda environment information');
  await _exec('conda', ['info']);
  await _exec('conda', ['list', '--name', 'fortran']);
  endGroup();

  // Add Conda bin paths to PATH so tools are usable
  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');
  const libBinPath = join(prefix, 'Library', 'bin');
  const usrBinPath = join(prefix, 'Library', 'usr', 'bin');
  const scriptsPath = join(prefix, 'Scripts');

  startGroup('Setting up environment paths');
  const paths = [binPath, libBinPath, usrBinPath, scriptsPath];
  for (const p of paths) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  // Verify that the compilers are installed and working
  startGroup('Verifying compiler versions');
  await _exec('where', ['gfortran']);
  await _exec('gfortran', ['--version']);
  await _exec('where', ['gcc']);
  await _exec('gcc', ['--version']);
  await _exec('where', ['g++']);
  await _exec('g++', ['--version']);
  endGroup();

  // Export compiler-related environment variables
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
    INCLUDE: [join(prefix, 'Library', 'include'), process.env.INCLUDE || ''].filter(Boolean).join(';')
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

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

  // Final success message
  info('✅ compiler setup complete');
}
