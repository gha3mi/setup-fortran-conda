import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { prependPathEntries } from '../../lib/environment.js';
import { getErrorMessage } from '../../lib/errors.js';
import { compareNumericVersions } from '../../lib/version.js';
import {
  assertLinux,
  configureLinuxCompiler,
  getCondaPrefix,
  runInGroup,
} from './common.js';
import { downloadFile, fetchTextWithCurl } from './install.js';

const NVHPC_APT_ROOT =
  'https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64';
const NVHPC_DOWNLOAD_PAGE = 'https://developer.nvidia.com/hpc-sdk-downloads';
const NVHPC_INSTALLATION_ROOT = '/opt/nvidia/hpc_sdk';
const NVHPC_ARCHITECTURE = 'Linux_x86_64';

async function freeDiskSpace() {
  await runInGroup('setup-fortran-conda: Free Disk Space', async () => {
    await exec('sudo', [
      'rm',
      '-rf',
      '/usr/local/lib/android',
      '/usr/local/android-sdk',
      '/usr/share/dotnet',
    ]);
  });
}

async function getLatestNvhpcVersion() {
  const page = await fetchTextWithCurl(NVHPC_DOWNLOAD_PAGE);
  const versions = [
    ...new Set(
      Array.from(page.matchAll(/hpc-sdk\/(\d+\.\d+)/g), (match) => match[1]),
    ),
  ].sort((left, right) => compareNumericVersions(right, left));

  if (!versions.length) {
    throw new Error(
      `Unable to resolve the latest NVIDIA HPC SDK version from ${NVHPC_DOWNLOAD_PAGE}.`,
    );
  }

  info(`Resolved latest NVIDIA HPC SDK version: ${versions[0]}`);
  return versions[0];
}

async function resolveNvhpcPackage(version) {
  if (!/^\d+\.\d+$/.test(version)) {
    throw new Error(
      `Invalid NVIDIA HPC SDK version "${version}". Expected MAJOR.MINOR.`,
    );
  }

  const packageId = `nvhpc-${version.replace(/\./g, '-')}`;
  const packageIndex = await fetchTextWithCurl(`${NVHPC_APT_ROOT}/Packages`, {
    retryCount: 5,
  });

  const packageStanza = packageIndex
    .split(/\r?\n\r?\n/)
    .find((entry) => entry.split(/\r?\n/).includes(`Package: ${packageId}`));
  const filenameLine = packageStanza
    ?.split(/\r?\n/)
    .find((line) => line.startsWith('Filename:'));
  const packageName = basename(
    filenameLine?.slice('Filename:'.length).trim() || '',
  );

  if (!packageName.endsWith('.deb')) {
    throw new Error(`NVIDIA package index does not contain ${packageId}.`);
  }

  return {
    path: join(process.env.RUNNER_TEMP || tmpdir(), packageName),
    url: `${NVHPC_APT_ROOT}/${packageName}`,
  };
}

export async function setup(version = '') {
  assertLinux();

  await freeDiskSpace();

  const resolvedVersion = version.trim() || (await getLatestNvhpcVersion());

  let nvhpcPackage;
  await runInGroup('setup-fortran-conda: Install NVIDIA HPC SDK', async () => {
    try {
      nvhpcPackage = await resolveNvhpcPackage(resolvedVersion);
      await downloadFile(nvhpcPackage.url, nvhpcPackage.path, {
        continueAt: '-',
        retryCount: 5,
        silent: true,
      });
      await exec('sudo', ['apt-get', 'update', '-y']);
      await exec('sudo', ['apt-get', 'install', '-y', nvhpcPackage.path]);
      info('NVIDIA HPC SDK installed');
    } catch (error) {
      throw new Error(
        `NVIDIA HPC SDK install failed: ${getErrorMessage(error)}`,
        { cause: error },
      );
    } finally {
      try {
        if (nvhpcPackage) {
          await rm(nvhpcPackage.path, { force: true });
        }
      } catch (error) {
        info(`Unable to remove NVIDIA installer: ${getErrorMessage(error)}`);
      }
    }
  });

  const versionRoot = join(
    NVHPC_INSTALLATION_ROOT,
    NVHPC_ARCHITECTURE,
    resolvedVersion,
  );
  const compilerBinDirectory = join(versionRoot, 'compilers', 'bin');
  const mpiBinDirectory = join(versionRoot, 'comm_libs', 'mpi', 'bin');
  const compilerLibraryDirectory = join(versionRoot, 'compilers', 'lib');
  const mpiLibraryDirectory = join(versionRoot, 'comm_libs', 'mpi', 'lib');
  const condaPrefix = await getCondaPrefix();

  await configureLinuxCompiler({
    paths: [compilerBinDirectory, mpiBinDirectory, join(condaPrefix, 'bin')],
    compilers: { fortran: 'nvfortran', c: 'nvc', cxx: 'nvc++' },
    environment: {
      LD_LIBRARY_PATH: prependPathEntries(
        [compilerLibraryDirectory, mpiLibraryDirectory],
        process.env.LD_LIBRARY_PATH,
      ),
      NVHPC: NVHPC_INSTALLATION_ROOT,
    },
  });
}
