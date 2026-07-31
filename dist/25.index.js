export const id = 25;
export const ids = [25,917,302];
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
/* harmony import */ var _lib_environment_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(3775);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(7507);
/* harmony import */ var _lib_github_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(739);
/* harmony import */ var _lib_version_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(1018);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(917);
/* harmony import */ var _install_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(3302);













const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function requestAompApi(url) {
  return (0,_lib_github_js__WEBPACK_IMPORTED_MODULE_7__/* .requestGitHubJson */ .rw)(url, (0,_lib_github_js__WEBPACK_IMPORTED_MODULE_7__/* .getGitHubToken */ .lK)());
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
  (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .assertLinux */ .b4)('AOMP setup is only supported on Linux.');

  await (0,_install_js__WEBPACK_IMPORTED_MODULE_9__/* .installAptPackages */ .wS)(
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

  await (0,_install_js__WEBPACK_IMPORTED_MODULE_9__/* .downloadVerifiedFile */ .P6)({
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

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .runInGroup */ .Se)('setup-fortran-conda: Extract AOMP', async () => {
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

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .getCondaPrefix */ .s6)(_common_js__WEBPACK_IMPORTED_MODULE_8__/* .TOOLS_ENVIRONMENT_NAME */ .uU);
  const binDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'bin');
  const libraryDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib');
  const library64Directory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib64');
  const ldLibraryPath = (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_6__/* .prependPathEntries */ .U)(
    [libraryDirectory, library64Directory].filter((candidate) =>
      (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(candidate),
    ),
    process.env.LD_LIBRARY_PATH,
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .configureLinuxCompiler */ .q3)({
    paths: [(0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(condaPrefix, 'bin'), binDirectory],
    compilers: { fortran: 'flang', c: 'clang', cxx: 'clang++' },
    environment: {
      AOMP_HOME: aompRoot,
      AOMP_ROOT: aompRoot,
      AOMP_VERSION: release.version,
      LD_LIBRARY_PATH: ldLibraryPath,
    },
  });
}


/***/ }),

/***/ 917:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Av: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Av),
/* harmony export */   SE: () => (/* binding */ setupCondaCompiler),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Se),
/* harmony export */   b4: () => (/* binding */ assertLinux),
/* harmony export */   dV: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.dV),
/* harmony export */   q3: () => (/* binding */ configureLinuxCompiler),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.s6),
/* harmony export */   uU: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.uU)
/* harmony export */ });
/* unused harmony export configureLinuxUlimits */
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9674);








function assertLinux(
  message = 'This setup script is only supported on Linux.',
) {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .assertPlatform */ .G6)('linux', message);
}

async function setupCondaCompiler({
  version = '',
  versionedPackages = [],
  packages = [],
  channels,
  compilers,
  additionalVerificationCommands = [],
  environment = {},
}) {
  assertLinux();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .installCondaCompilerPackages */ .dF)({
    version,
    versionedPackages,
    packages,
    channels,
  });

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .getCondaPrefix */ .s6)();
  await configureLinuxCompiler({
    paths: [(0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(condaPrefix, 'bin')],
    compilers,
    verificationCommands: (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .createCompilerVerificationCommands */ .dQ)(
      compilers,
      additionalVerificationCommands,
    ),
    environment: {
      ...environment,
      LD_LIBRARY_PATH: (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .prependPathEntries */ .Up)(
        [(0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    },
  });
}

async function configureLinuxCompiler({
  paths,
  compilers,
  environment = {},
  verificationCommands,
}) {
  assertLinux();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .addExistingPaths */ .Bf)(paths);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .verifyCommands */ .I6)(
    verificationCommands || (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .createCompilerVerificationCommands */ .dQ)(compilers),
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .createCompilerEnvironment */ .Tp)(
      compilers.fortran,
      compilers.c,
      compilers.cxx,
      environment,
    ),
  );
  await configureLinuxUlimits();

  (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .logCompilerSetupComplete */ .Ys)();
}

async function configureLinuxUlimits() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Configure Linux Environment',
    async () => {
      const command =
        'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
      const script = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(process.env.RUNNER_TEMP, 'ulimit.sh');
      (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.appendFileSync)(script, `${command}${node_os__WEBPACK_IMPORTED_MODULE_2__.EOL}`);
      (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportEnvironmentVariable */ .qY)('BASH_ENV', script);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
    },
  );
}


/***/ }),

/***/ 3302:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  PE: () => (/* binding */ downloadFile),
  P6: () => (/* binding */ downloadVerifiedFile),
  U_: () => (/* binding */ fetchTextWithCurl),
  wS: () => (/* binding */ installAptPackages)
});

// EXTERNAL MODULE: ./node_modules/@actions/exec/lib/exec.js + 5 modules
var exec = __webpack_require__(2876);
// EXTERNAL MODULE: ./node_modules/@actions/core/lib/core.js + 11 modules
var core = __webpack_require__(3360);
// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__(7598);
// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(3024);
;// CONCATENATED MODULE: ./src/lib/checksum.js




function calculateSha256(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,external_node_crypto_.createHash)('sha256');
    const stream = (0,external_node_fs_.createReadStream)(file);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifySha256({ file, product, version, expected }) {
  if (!expected) {
    (0,core/* warning */.$e)(
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

  (0,core/* info */.pq)(`Verified ${product} ${version} SHA-256 checksum`);
}

// EXTERNAL MODULE: ./src/lib/command.js
var command = __webpack_require__(7819);
// EXTERNAL MODULE: ./src/lib/errors.js
var errors = __webpack_require__(7507);
// EXTERNAL MODULE: ./src/compilers/common.js
var common = __webpack_require__(9674);
;// CONCATENATED MODULE: ./src/compilers/linux/install.js






async function installAptPackages(
  packages,
  {
    groupName = 'setup-fortran-conda: Install System Packages',
    errorMessage = 'System package installation failed',
  } = {},
) {
  await (0,common/* runInGroup */.Se)(groupName, async () => {
    try {
      await (0,exec/* exec */.m)('sudo', ['apt-get', 'update', '-y']);
      await (0,exec/* exec */.m)('sudo', ['apt-get', 'install', '-y', ...packages]);
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,errors/* getErrorMessage */.u)(error)}`, {
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

  await (0,exec/* exec */.m)('curl', args);
}

async function downloadVerifiedFile({
  url,
  destination,
  product,
  version,
  checksum,
  groupName,
  errorMessage,
  downloadOptions = {},
}) {
  await (0,common/* runInGroup */.Se)(groupName, async () => {
    try {
      await downloadFile(url, destination, downloadOptions);
      await verifySha256({
        file: destination,
        product,
        version,
        expected: checksum,
      });
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,errors/* getErrorMessage */.u)(error)}`, {
        cause: error,
      });
    }
  });
}

async function fetchTextWithCurl(
  url,
  { retryCount = 3, userAgent = 'setup-fortran-conda' } = {},
) {
  const result = await (0,command/* captureCommand */.g)('curl', [
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


/***/ })

};
