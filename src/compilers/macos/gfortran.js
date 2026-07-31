import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { captureCommand } from '../../lib/command.js';
import { prependFlag } from '../../lib/environment.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  assertMacOs,
  configureMacOsCompiler,
  getCondaPrefix,
  installCondaCompilerPackages,
  runInGroup,
} from './common.js';

async function detectHomebrewGccCommand() {
  const result = await captureCommand('brew', ['--prefix']);
  if (result.exitCode !== 0) {
    throw new Error(`Unable to detect Homebrew prefix: ${result.stderr}`);
  }

  const binDirectory = join(result.stdout.trim(), 'bin');
  if (!existsSync(binDirectory)) {
    throw new Error(`Homebrew bin directory not found: ${binDirectory}`);
  }

  const versions = readdirSync(binDirectory)
    .filter((name) => name.startsWith('gcc-'))
    .map((name) => Number.parseInt(name.replace('gcc-', ''), 10))
    .filter(Number.isFinite);
  if (!versions.length) {
    throw new Error(
      `No versioned Homebrew gcc executable found in ${binDirectory}`,
    );
  }
  return `gcc-${Math.max(...versions)}`;
}

function hasCondaGccSpecs(root) {
  if (!existsSync(root)) {
    return false;
  }

  return readdirSync(root, { withFileTypes: true }).some((entry) => {
    if (entry.isFile()) {
      return entry.name === 'conda.specs';
    }
    return entry.isDirectory() && hasCondaGccSpecs(join(root, entry.name));
  });
}

function createCondaGfortranEnvironment(condaPrefix) {
  if (!hasCondaGccSpecs(join(condaPrefix, 'lib', 'gcc'))) {
    return {};
  }

  const flag = '-nodefaultrpaths';
  info('Using Conda gfortran RPATH without duplicate GCC defaults');
  return {
    FFLAGS: prependFlag(flag, process.env.FFLAGS),
    FPM_LDFLAGS: prependFlag(flag, process.env.FPM_LDFLAGS),
  };
}

async function installHomebrewGcc(version) {
  return runInGroup('setup-fortran-conda: Install Homebrew GCC', async () => {
    try {
      if (version) {
        const majorVersion = version.split('.')[0];
        await exec('brew', ['install', `gcc@${majorVersion}`], {
          silent: true,
        });
        info(`Homebrew gcc@${majorVersion} installed`);
        return {
          cCompiler: `gcc-${majorVersion}`,
          cxxCompiler: `g++-${majorVersion}`,
        };
      }

      await exec('brew', ['install', 'gcc'], { silent: true });
      info('Homebrew latest gcc installed');
      const cCompiler = await detectHomebrewGccCommand();
      return {
        cCompiler,
        cxxCompiler: cCompiler.replace('gcc', 'g++'),
      };
    } catch (error) {
      throw new Error(
        `Homebrew gcc install failed: ${getErrorMessage(error)}`,
        { cause: error },
      );
    }
  });
}

export async function setup(version = '') {
  assertMacOs();

  const { cCompiler, cxxCompiler } = await installHomebrewGcc(version);
  await installCondaCompilerPackages({
    version,
    versionedPackages: ['gfortran'],
    packages: ['binutils'],
  });

  const condaPrefix = await getCondaPrefix();
  await configureMacOsCompiler({
    paths: [join(condaPrefix, 'bin')],
    compilers: {
      fortran: 'gfortran',
      c: cCompiler,
      cxx: cxxCompiler,
    },
    environment: createCondaGfortranEnvironment(condaPrefix),
  });
}
