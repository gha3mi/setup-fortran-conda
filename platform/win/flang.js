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

// Check if a given command exists in PATH using 'where' (Windows)
async function commandExists(cmd) {
  try {
    await _exec('where', [cmd], { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Locate Visual Studio installation and extract the MSVC build environment
async function runVcvars64() {
  // Ensure vswhere is available to find Visual Studio
  if (!(await commandExists('vswhere'))) {
    throw new Error('"vswhere" not found in PATH. Ensure Visual Studio is installed.');
  }

  startGroup('Detecting Visual Studio installation');

  // Query the latest Visual Studio installation path
  let vsPath = '';
  await _exec('vswhere', [
    '-latest',
    '-products', '*',
    '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
    '-property', 'installationPath'
  ], {
    silent: true,
    listeners: {
      stdout: data => { vsPath += data.toString(); }
    }
  });

  vsPath = vsPath.trim();
  if (!vsPath) throw new Error('vswhere did not return any installation path');

  // Construct the path to vcvars64.bat
  const vcvars = join(vsPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  info(`Found Visual Studio: ${vsPath}`);
  info(`Resolved vcvars64.bat: ${vcvars}`);
  endGroup();

  if (!existsSync(vcvars)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvars}`);
  }

  startGroup('Running vcvars64.bat');

  // Run vcvars64.bat and capture the resulting environment variables
  let output = '';
  const code = await _exec('cmd.exe', ['/c', vcvars, '&&', 'set'], {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: data => { output += data.toString(); },
      stderr: data => { output += data.toString(); }
    }
  });

  if (code !== 0) {
    throw new Error(`vcvars64.bat failed with code ${code}:\n${output}`);
  } else {
    info(`vcvars64.bat ran successfully`);
  }

  endGroup();

  startGroup('Exporting MSVC environment variables');

  // Parse and export environment variables line-by-line
  let exportedCount = 0;
  output.split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=');
      exportEnv(key, value);
      info(`Exported: ${key}`);
      exportedCount++;
    }
  });

  info(`MSVC environment loaded with ${exportedCount} variables`);
  endGroup();
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
    version ? `flang=${version}` : 'flang',
    version ? `flang-rt_win-64=${version}` : 'flang-rt_win-64',
    version ? `llvm=${version}` : 'llvm',
    version ? `clang-tools=${version}` : 'clang-tools',
    version ? `llvm-openmp=${version}` : 'llvm-openmp',
    version ? `lld=${version}` : 'lld'
  ];


  // Prepare MSVC environment
  await runVcvars64();

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

  // Add Conda bin paths to PATH so tools are usable
  const prefix = await getCondaPrefix('fortran');
  const binPath = join(prefix, 'bin');
  const libBinPath = join(prefix, 'Library', 'bin');
  const usrBinPath = join(prefix, 'Library', 'usr', 'bin');
  const scriptsPath = join(prefix, 'Scripts');
  const libPath = join(prefix, 'Library', 'lib');

  startGroup('Setting up environment paths');
  const paths = [binPath, libBinPath, usrBinPath, scriptsPath, libPath];
  for (const p of paths) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  // Verify that the compilers are installed and working
  startGroup('Verifying compiler versions');
  await _exec('where', ['flang']);
  await _exec('flang', ['--version']);
  await _exec('where', ['clang-cl']);
  await _exec('clang-cl', ['--version']);

  // Export compiler-related environment variables
  startGroup('Exporting compiler environment variables');
  const envVars = {
    FC: 'flang',
    CC: 'clang-cl',
    CXX: 'clang-cl',
    FPM_FC: 'flang',
    FPM_CC: 'clang-cl',
    FPM_CXX: 'clang-cl',
    CMAKE_Fortran_COMPILER: 'flang',
    CMAKE_C_COMPILER: 'clang-cl',
    CMAKE_CXX_COMPILER: 'clang-cl',
    INCLUDE: [join(prefix, 'Library', 'include'), process.env.INCLUDE || ''].filter(Boolean).join(';'),
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
