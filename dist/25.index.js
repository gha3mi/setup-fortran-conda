export const id = 25;
export const ids = [25,917];
export const modules = {

/***/ 8025:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1455);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6760);
/* harmony import */ var _lib_checksum_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(3379);
/* harmony import */ var _lib_environment_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3775);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(7507);
/* harmony import */ var _lib_github_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(739);
/* harmony import */ var _lib_version_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(1018);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(917);













const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function requestAompApi(url) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  return (0,_lib_github_js__WEBPACK_IMPORTED_MODULE_8__/* .requestGitHubJson */ .rw)(url, token);
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
    .sort((left, right) => (0,_lib_version_js__WEBPACK_IMPORTED_MODULE_10__/* .compareNumericVersions */ .UA)(right.version, left.version));

  const latestRelease = availableReleases[0];
  if (!latestRelease) {
    throw new Error(
      'Unable to resolve latest AOMP binary tarball from ROCm/aomp releases.',
    );
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest AOMP version: ${latestRelease.version}`);
  return latestRelease;
}

function findAompRoot(directory, depth = 0) {
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(directory, 'bin', 'flang'))) {
    return directory;
  }
  if (depth >= 5) {
    return '';
  }

  for (const entry of (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(directory, {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(directory, entry.name);
    const matchingRoot = findAompRoot(candidate, depth + 1);
    if (matchingRoot) {
      return matchingRoot;
    }
  }

  return '';
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .assertLinux */ .b4)('AOMP setup is only supported on Linux.');

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .installAptPackages */ .wS)(
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
  const archivePath = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)((0,node_os__WEBPACK_IMPORTED_MODULE_4__.tmpdir)(), `aomp-${release.version}.tar.gz`);
  const extractionDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(
    process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_4__.tmpdir)(),
    `setup-fortran-conda-aomp-${release.version}`,
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Download AOMP Binary Tarball',
    async () => {
      try {
        await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .downloadFile */ .PE)(release.url, archivePath, {
          connectTimeout: 30,
          retryCount: 3,
          retryDelay: 2,
        });
        await (0,_lib_checksum_js__WEBPACK_IMPORTED_MODULE_6__/* .verifySha256 */ .n)({
          file: archivePath,
          product: 'AOMP',
          version: release.version,
          expected: release.checksum,
        });
      } catch (error) {
        throw new Error(`AOMP download failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_11__/* .getErrorMessage */ .u)(error)}`, {
          cause: error,
        });
      }
    },
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .runInGroup */ .Se)('setup-fortran-conda: Extract AOMP', async () => {
    (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.mkdirSync)(extractionDirectory, { recursive: true });
    try {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('tar', ['-xzf', archivePath, '-C', extractionDirectory]);
    } catch (error) {
      throw new Error(`AOMP extraction failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_11__/* .getErrorMessage */ .u)(error)}`, {
        cause: error,
      });
    } finally {
      await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_3__.rm)(archivePath, { force: true });
    }
  });

  const aompRoot = findAompRoot(extractionDirectory);
  if (!aompRoot) {
    throw new Error(
      `Unable to locate AOMP installation root under ${extractionDirectory}.`,
    );
  }

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .getCondaPrefix */ .s6)(_common_js__WEBPACK_IMPORTED_MODULE_9__/* .TOOLS_ENVIRONMENT_NAME */ .uU);
  const binDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'bin');
  const libraryDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib');
  const library64Directory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib64');
  const ldLibraryPath = (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_7__/* .prependPathEntries */ .U)(
    [libraryDirectory, library64Directory].filter((candidate) =>
      (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(candidate),
    ),
    process.env.LD_LIBRARY_PATH,
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(condaPrefix, 'bin'), binDirectory]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .verifyCommands */ .I6)([
    { command: 'flang', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .createCompilerEnvironment */ .Tp)('flang', 'clang', 'clang++', {
      AOMP_HOME: aompRoot,
      AOMP_ROOT: aompRoot,
      AOMP_VERSION: release.version,
      LD_LIBRARY_PATH: ldLibraryPath,
    }),
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .configureLinuxUlimits */ .O7)();

  (0,_common_js__WEBPACK_IMPORTED_MODULE_9__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ }),

/***/ 917:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Bf),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.MA),
/* harmony export */   O7: () => (/* binding */ configureLinuxUlimits),
/* harmony export */   PE: () => (/* binding */ downloadFile),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Qv),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Se),
/* harmony export */   Tp: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Tp),
/* harmony export */   U_: () => (/* binding */ fetchTextWithCurl),
/* harmony export */   Up: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Up),
/* harmony export */   Ys: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Ys),
/* harmony export */   b4: () => (/* binding */ assertLinux),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.s6),
/* harmony export */   uU: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.uU),
/* harmony export */   wS: () => (/* binding */ installAptPackages),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.x7),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.zk)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);
/* harmony import */ var _lib_command_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7819);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(7507);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9674);











function assertLinux(
  message = 'This setup script is only supported on Linux.',
) {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .assertPlatform */ .G6)('linux', message);
}

async function configureLinuxUlimits() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Configure Linux Environment',
    async () => {
      const command =
        'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
      const script = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(process.env.RUNNER_TEMP, 'ulimit.sh');
      (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(script, `${command}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
      (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .exportEnvironmentVariable */ .qY)('BASH_ENV', script);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
    },
  );
}

async function installAptPackages(
  packages,
  {
    groupName = 'setup-fortran-conda: Install System Packages',
    errorMessage = 'System package installation failed',
  } = {},
) {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)(groupName, async () => {
    try {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-y', ...packages]);
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_7__/* .getErrorMessage */ .u)(error)}`, {
        cause: error,
      });
    }
  });
}

async function downloadFile(
  url,
  destination,
  {
    connectTimeout,
    continueAt,
    http1 = false,
    retryCount = 3,
    retryDelay,
    silent = false,
  } = {},
) {
  const args = [
    ...(http1 ? ['--http1.1'] : []),
    '--fail',
    '--location',
    ...(silent ? ['--silent', '--show-error'] : []),
    ...(connectTimeout ? ['--connect-timeout', String(connectTimeout)] : []),
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    ...(retryDelay ? ['--retry-delay', String(retryDelay)] : []),
    ...(continueAt ? ['--continue-at', continueAt] : []),
    '--output',
    destination,
    url,
  ];

  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('curl', args);
}

async function fetchTextWithCurl(
  url,
  { retryCount = 3, userAgent = 'setup-fortran-conda' } = {},
) {
  const result = await (0,_lib_command_js__WEBPACK_IMPORTED_MODULE_5__/* .captureCommand */ .g)('curl', [
    '--fail',
    '--location',
    '--silent',
    '--show-error',
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    '--user-agent',
    userAgent,
    url,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to fetch ${url}: ${result.stderr || result.stdout}`,
    );
  }

  return result.stdout;
}


/***/ }),

/***/ 3379:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ verifySha256)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7598);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);




function calculateSha256(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,node_crypto__WEBPACK_IMPORTED_MODULE_1__.createHash)('sha256');
    const stream = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.createReadStream)(file);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifySha256({ file, product, version, expected }) {
  if (!expected) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
      `No ${product} checksum is known for ${version}; ` +
        'skipping checksum verification.',
    );
    return;
  }

  const actual = await calculateSha256(file);
  if (actual !== expected) {
    throw new Error(
      `${product} ${version} checksum mismatch: ` +
        `expected ${expected}, got ${actual}`,
    );
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Verified ${product} ${version} SHA-256 checksum`);
}


/***/ })

};
