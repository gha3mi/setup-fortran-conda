import { info } from '@actions/core';
import { exec as run } from '@actions/exec';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertMacOs,
  compilerEnvironment,
  exportCompilerEnvironment,
  getCondaPrefix,
  grouped,
  installCondaPackages,
  setMacOsSdkRoot,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

async function detectHomebrewGcc() {
  let prefix = '';
  await run('brew', ['--prefix'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        prefix += data.toString();
      },
    },
  });

  const bin = join(prefix.trim(), 'bin');
  if (!existsSync(bin)) {
    throw new Error(`Homebrew bin directory not found: ${bin}`);
  }

  const versions = readdirSync(bin)
    .filter((name) => name.startsWith('gcc-'))
    .map((name) => Number.parseInt(name.replace('gcc-', ''), 10))
    .filter(Number.isFinite);
  if (!versions.length) {
    throw new Error(`No versioned Homebrew gcc executable found in ${bin}`);
  }
  return `gcc-${Math.max(...versions)}`;
}

function hasCondaGccSpecs(root) {
  if (!existsSync(root)) return false;

  return readdirSync(root, { withFileTypes: true }).some((entry) => {
    if (entry.isFile()) return entry.name === 'conda.specs';
    return (
      entry.isDirectory() &&
      hasCondaGccSpecs(join(root, entry.name))
    );
  });
}

function prependFlag(flag, current = '') {
  const value = String(current).trim();
  if (value.split(/\s+/).includes(flag)) return value;
  return [flag, value].filter(Boolean).join(' ');
}

function condaGfortranEnvironment(prefix) {
  if (!hasCondaGccSpecs(join(prefix, 'lib', 'gcc'))) return {};

  const flag = '-nodefaultrpaths';
  info('Using Conda gfortran RPATH without duplicate GCC defaults');
  return {
    FFLAGS: prependFlag(flag, process.env.FFLAGS),
    FPM_LDFLAGS: prependFlag(flag, process.env.FPM_LDFLAGS),
  };
}

async function installHomebrewGcc(version) {
  return grouped('setup-fortran-conda: Install Homebrew GCC', async () => {
    try {
      if (version) {
        const major = version.split('.')[0];
        await run('brew', ['install', `gcc@${major}`], { silent: true });
        info(`Homebrew gcc@${major} installed`);
        return { c: `gcc-${major}`, cxx: `g++-${major}` };
      }

      await run('brew', ['install', 'gcc'], { silent: true });
      info('Homebrew latest gcc installed');
      const c = await detectHomebrewGcc();
      return { c, cxx: c.replace('gcc', 'g++') };
    } catch (error) {
      throw new Error(`Homebrew gcc install failed: ${error.message}`);
    }
  });
}

export async function setup(version = '') {
  assertMacOs();

  const { c, cxx } = await installHomebrewGcc(version);
  await installCondaPackages([
    version ? `gfortran=${version}` : 'gfortran',
    'binutils',
  ]);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')], { log: false });
  await setMacOsSdkRoot();

  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: c, args: ['--version'] },
    { command: cxx, args: ['--version'] },
  ]);
  await exportCompilerEnvironment(
    compilerEnvironment(
      'gfortran',
      c,
      cxx,
      condaGfortranEnvironment(prefix)
    )
  );

  info('✅ compiler setup complete');
}
