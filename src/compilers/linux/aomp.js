import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prependPathEntries } from '../../lib/environment.js';
import { getErrorMessage } from '../../lib/errors.js';
import { getGitHubToken, requestGitHubJson } from '../../lib/github.js';
import { compareNumericVersions } from '../../lib/version.js';
import {
  assertLinux,
  configureLinuxCompiler,
  getCondaPrefix,
  runInGroup,
  TOOLS_ENVIRONMENT_NAME,
} from './common.js';
import { downloadVerifiedFile, installAptPackages } from './install.js';

const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function requestAompApi(url) {
  return requestGitHubJson(url, getGitHubToken());
}

function normalizeAompVersion(version = '') {
  const normalizedInput = version.trim().toLowerCase();
  if (!normalizedInput || normalizedInput === 'latest') {
    return 'latest';
  }

  const versionWithoutPrefix = normalizedInput
    .replace(/^v/, '')
    .replace(/^rel_/, '')
    .replace(/^aomp-/, '')
    .replace(/\.tar\.gz$/, '');

  if (!/^\d+\.\d+-\d+$/.test(versionWithoutPrefix)) {
    throw new Error(
      'AOMP compiler-version must be "latest" or major.minor-patch, ' +
        `for example "23.0-0"; got "${version}".`,
    );
  }

  return versionWithoutPrefix;
}

function findAompReleaseAsset(release) {
  for (const asset of release.assets || []) {
    const match = String(asset.name || '').match(
      /^aomp-(\d+\.\d+-\d+)\.tar\.gz$/,
    );
    if (!match) {
      continue;
    }

    return {
      version: match[1],
      url: asset.browser_download_url,
      checksum: String(asset.digest || '').replace(/^sha256:/, ''),
    };
  }

  return null;
}

async function resolveAompRelease(requestedVersion = '') {
  const normalizedVersion = normalizeAompVersion(requestedVersion);

  if (normalizedVersion !== 'latest') {
    const release = await requestAompApi(
      `${AOMP_REPO_API}/tags/rel_${normalizedVersion}`,
    );
    const matchingRelease = findAompReleaseAsset(release);
    if (matchingRelease) {
      return matchingRelease;
    }
    throw new Error(
      `Unable to locate AOMP binary tarball for ${normalizedVersion}.`,
    );
  }

  const releases = await requestAompApi(`${AOMP_REPO_API}?per_page=100`);
  const availableReleases = releases
    .map(findAompReleaseAsset)
    .filter(Boolean)
    .sort((left, right) => compareNumericVersions(right.version, left.version));

  const latestRelease = availableReleases[0];
  if (!latestRelease) {
    throw new Error(
      'Unable to resolve latest AOMP binary tarball from ROCm/aomp releases.',
    );
  }

  info(`Resolved latest AOMP version: ${latestRelease.version}`);
  return latestRelease;
}

function findAompRoot(directory, depth = 0) {
  if (existsSync(join(directory, 'bin', 'flang'))) {
    return directory;
  }
  if (depth >= 5) {
    return '';
  }

  for (const entry of readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = join(directory, entry.name);
    const matchingRoot = findAompRoot(candidate, depth + 1);
    if (matchingRoot) {
      return matchingRoot;
    }
  }

  return '';
}

export async function setup(version = '') {
  assertLinux('AOMP setup is only supported on Linux.');

  await installAptPackages(
    [
      'ca-certificates',
      'curl',
      'tar',
      'gzip',
      'libstdc++6',
      'libtinfo6',
      'libxml2',
      'libdrm2',
      'zlib1g',
      'python3',
    ],
    {
      groupName: 'setup-fortran-conda: Install AOMP System Dependencies',
      errorMessage: 'AOMP system dependency installation failed',
    },
  );

  const release = await resolveAompRelease(version);
  const archivePath = join(tmpdir(), `aomp-${release.version}.tar.gz`);
  const extractionDirectory = join(
    process.env.RUNNER_TEMP || tmpdir(),
    `setup-fortran-conda-aomp-${release.version}`,
  );

  await downloadVerifiedFile({
    url: release.url,
    destination: archivePath,
    product: 'AOMP',
    version: release.version,
    checksum: release.checksum,
    groupName: 'setup-fortran-conda: Download AOMP Binary Tarball',
    errorMessage: 'AOMP download failed',
    downloadOptions: {
      connectTimeout: 30,
      retryCount: 3,
      retryDelay: 2,
    },
  });

  await runInGroup('setup-fortran-conda: Extract AOMP', async () => {
    mkdirSync(extractionDirectory, { recursive: true });
    try {
      await exec('tar', ['-xzf', archivePath, '-C', extractionDirectory]);
    } catch (error) {
      throw new Error(`AOMP extraction failed: ${getErrorMessage(error)}`, {
        cause: error,
      });
    } finally {
      await rm(archivePath, { force: true });
    }
  });

  const aompRoot = findAompRoot(extractionDirectory);
  if (!aompRoot) {
    throw new Error(
      `Unable to locate AOMP installation root under ${extractionDirectory}.`,
    );
  }

  const condaPrefix = await getCondaPrefix(TOOLS_ENVIRONMENT_NAME);
  const binDirectory = join(aompRoot, 'bin');
  const libraryDirectory = join(aompRoot, 'lib');
  const library64Directory = join(aompRoot, 'lib64');
  const ldLibraryPath = prependPathEntries(
    [libraryDirectory, library64Directory].filter((candidate) =>
      existsSync(candidate),
    ),
    process.env.LD_LIBRARY_PATH,
  );

  await configureLinuxCompiler({
    paths: [join(condaPrefix, 'bin'), binDirectory],
    compilers: { fortran: 'flang', c: 'clang', cxx: 'clang++' },
    environment: {
      AOMP_HOME: aompRoot,
      AOMP_ROOT: aompRoot,
      AOMP_VERSION: release.version,
      LD_LIBRARY_PATH: ldLibraryPath,
    },
  });
}
