import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync, readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifySha256 } from '../../lib/checksum.js';
import { prependPathEntries } from '../../lib/environment.js';
import { getErrorMessage } from '../../lib/errors.js';
import { prepareAoccEnvironment } from './aocc/environment.js';
import { resolveAoccRelease } from './aocc/release.js';
import {
  addExistingPaths,
  assertLinux,
  configureLinuxUlimits,
  createCompilerEnvironment,
  downloadFile,
  exportCompilerEnvironment,
  getCondaPrefix,
  installAptPackages,
  logCompilerSetupComplete,
  runInGroup,
  TOOLS_ENVIRONMENT_NAME,
  verifyCommands,
} from './common.js';

function resolveAoccRoot(version) {
  const expectedRoot = `/opt/AMD/aocc-compiler-${version}`;
  if (existsSync(expectedRoot)) {
    return expectedRoot;
  }

  const installationDirectory = '/opt/AMD';
  if (existsSync(installationDirectory)) {
    const matchingDirectories = readdirSync(installationDirectory)
      .filter(
        (name) =>
          name === `aocc-compiler-${version}` ||
          name.startsWith('aocc-compiler-'),
      )
      .sort();
    const matchingDirectory =
      matchingDirectories.find((name) => name === `aocc-compiler-${version}`) ||
      matchingDirectories.at(-1);
    if (matchingDirectory) {
      return join(installationDirectory, matchingDirectory);
    }
  }

  throw new Error(`Unable to locate AOCC installation under ${expectedRoot}.`);
}

export async function setup(version = '') {
  assertLinux();

  await installAptPackages(
    [
      'ca-certificates',
      'curl',
      'libstdc++6',
      'libncurses-dev',
      'zlib1g',
      'libxml2',
      'libquadmath0',
      'python3',
    ],
    {
      groupName: 'setup-fortran-conda: Install AOCC System Dependencies',
      errorMessage: 'AOCC system dependency installation failed',
    },
  );

  const release = await resolveAoccRelease(version);
  const resolvedVersion = release.version;
  const packagePath = join(
    tmpdir(),
    `aocc-compiler-${resolvedVersion}_1_amd64.deb`,
  );

  await runInGroup(
    'setup-fortran-conda: Download AOCC Debian Package',
    async () => {
      try {
        await downloadFile(release.url, packagePath, {
          connectTimeout: 30,
          http1: true,
          retryCount: 3,
          retryDelay: 2,
        });
        await verifySha256({
          file: packagePath,
          product: 'AOCC',
          version: resolvedVersion,
          expected: release.checksum,
        });
      } catch (error) {
        throw new Error(`AOCC download failed: ${getErrorMessage(error)}`, {
          cause: error,
        });
      }
    },
  );

  await runInGroup(
    'setup-fortran-conda: Install AOCC Debian Package',
    async () => {
      try {
        const exitCode = await exec('sudo', ['dpkg', '-i', packagePath], {
          ignoreReturnCode: true,
        });
        if (exitCode !== 0) {
          await exec('sudo', ['apt-get', 'install', '-f', '-y']);
        }
        info('AOCC Debian package installed');
      } catch (error) {
        throw new Error(`AOCC install failed: ${getErrorMessage(error)}`, {
          cause: error,
        });
      } finally {
        await rm(packagePath, { force: true });
      }
    },
  );

  const condaPrefix = await getCondaPrefix(TOOLS_ENVIRONMENT_NAME);
  const aoccRoot = resolveAoccRoot(resolvedVersion);
  const libraryDirectory = join(aoccRoot, 'lib');
  const library32Directory = join(aoccRoot, 'lib32');
  const {
    binDirectory,
    wrapperDirectory,
    variables: aoccEnvironment,
  } = await prepareAoccEnvironment(aoccRoot);
  await addExistingPaths([
    join(condaPrefix, 'bin'),
    binDirectory,
    wrapperDirectory,
  ]);

  const ldLibraryPath = prependPathEntries(
    [libraryDirectory, library32Directory].filter((candidate) =>
      existsSync(candidate),
    ),
    aoccEnvironment.LD_LIBRARY_PATH || process.env.LD_LIBRARY_PATH,
  );
  const additionalEnvironment = Object.fromEntries(
    Object.entries(aoccEnvironment).filter(
      ([key]) => key !== 'PATH' && key !== 'LD_LIBRARY_PATH',
    ),
  );

  await verifyCommands([
    { command: 'amdflang', args: ['--version'] },
    { command: 'amdclang', args: ['-v'] },
    { command: 'amdclang++', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('amdflang', 'amdclang', 'amdclang++', {
      ...additionalEnvironment,
      AOCC_HOME: aoccRoot,
      AOCC_ROOT: aoccRoot,
      LD_LIBRARY_PATH: ldLibraryPath,
    }),
  );

  await configureLinuxUlimits();

  logCompilerSetupComplete();
}
