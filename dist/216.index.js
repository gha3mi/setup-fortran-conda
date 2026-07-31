export const id = 216;
export const ids = [216,917,302];
export const modules = {

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


/***/ }),

/***/ 3216:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1455);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);
/* harmony import */ var _lib_environment_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(3775);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(7507);
/* harmony import */ var _lib_version_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(1018);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(917);
/* harmony import */ var _install_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3302);











const NVHPC_APT_ROOT =
  'https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64';
const NVHPC_DOWNLOAD_PAGE = 'https://developer.nvidia.com/hpc-sdk-downloads';
const NVHPC_INSTALLATION_ROOT = '/opt/nvidia/hpc_sdk';
const NVHPC_ARCHITECTURE = 'Linux_x86_64';

async function freeDiskSpace() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)('setup-fortran-conda: Free Disk Space', async () => {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
      'rm',
      '-rf',
      '/usr/local/lib/android',
      '/usr/local/android-sdk',
      '/usr/share/dotnet',
    ]);
  });
}

async function getLatestNvhpcVersion() {
  const page = await (0,_install_js__WEBPACK_IMPORTED_MODULE_7__/* .fetchTextWithCurl */ .U_)(NVHPC_DOWNLOAD_PAGE);
  const versions = [
    ...new Set(
      Array.from(page.matchAll(/hpc-sdk\/(\d+\.\d+)/g), (match) => match[1]),
    ),
  ].sort((left, right) => (0,_lib_version_js__WEBPACK_IMPORTED_MODULE_8__/* .compareNumericVersions */ .UA)(right, left));

  if (!versions.length) {
    throw new Error(
      `Unable to resolve the latest NVIDIA HPC SDK version from ${NVHPC_DOWNLOAD_PAGE}.`,
    );
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest NVIDIA HPC SDK version: ${versions[0]}`);
  return versions[0];
}

async function resolveNvhpcPackage(version) {
  if (!/^\d+\.\d+$/.test(version)) {
    throw new Error(
      `Invalid NVIDIA HPC SDK version "${version}". Expected MAJOR.MINOR.`,
    );
  }

  const packageId = `nvhpc-${version.replace(/\./g, '-')}`;
  const packageIndex = await (0,_install_js__WEBPACK_IMPORTED_MODULE_7__/* .fetchTextWithCurl */ .U_)(`${NVHPC_APT_ROOT}/Packages`, {
    retryCount: 5,
  });

  const packageStanza = packageIndex
    .split(/\r?\n\r?\n/)
    .find((entry) => entry.split(/\r?\n/).includes(`Package: ${packageId}`));
  const filenameLine = packageStanza
    ?.split(/\r?\n/)
    .find((line) => line.startsWith('Filename:'));
  const packageName = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.basename)(
    filenameLine?.slice('Filename:'.length).trim() || '',
  );

  if (!packageName.endsWith('.deb')) {
    throw new Error(`NVIDIA package index does not contain ${packageId}.`);
  }

  return {
    path: (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_3__.tmpdir)(), packageName),
    url: `${NVHPC_APT_ROOT}/${packageName}`,
  };
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .assertLinux */ .b4)();

  await freeDiskSpace();

  const resolvedVersion = version.trim() || (await getLatestNvhpcVersion());

  let nvhpcPackage;
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)('setup-fortran-conda: Install NVIDIA HPC SDK', async () => {
    try {
      nvhpcPackage = await resolveNvhpcPackage(resolvedVersion);
      await (0,_install_js__WEBPACK_IMPORTED_MODULE_7__/* .downloadFile */ .PE)(nvhpcPackage.url, nvhpcPackage.path, {
        continueAt: '-',
        retryCount: 5,
        silent: true,
      });
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-y', nvhpcPackage.path]);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('NVIDIA HPC SDK installed');
    } catch (error) {
      throw new Error(
        `NVIDIA HPC SDK install failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_9__/* .getErrorMessage */ .u)(error)}`,
        { cause: error },
      );
    } finally {
      try {
        if (nvhpcPackage) {
          await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_2__.rm)(nvhpcPackage.path, { force: true });
        }
      } catch (error) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Unable to remove NVIDIA installer: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_9__/* .getErrorMessage */ .u)(error)}`);
      }
    }
  });

  const versionRoot = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(
    NVHPC_INSTALLATION_ROOT,
    NVHPC_ARCHITECTURE,
    resolvedVersion,
  );
  const compilerBinDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(versionRoot, 'compilers', 'bin');
  const mpiBinDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(versionRoot, 'comm_libs', 'mpi', 'bin');
  const compilerLibraryDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(versionRoot, 'compilers', 'lib');
  const mpiLibraryDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(versionRoot, 'comm_libs', 'mpi', 'lib');
  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .getCondaPrefix */ .s6)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .configureLinuxCompiler */ .q3)({
    paths: [compilerBinDirectory, mpiBinDirectory, (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(condaPrefix, 'bin')],
    compilers: { fortran: 'nvfortran', c: 'nvc', cxx: 'nvc++' },
    environment: {
      LD_LIBRARY_PATH: (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_5__/* .prependPathEntries */ .U)(
        [compilerLibraryDirectory, mpiLibraryDirectory],
        process.env.LD_LIBRARY_PATH,
      ),
      NVHPC: NVHPC_INSTALLATION_ROOT,
    },
  });
}


/***/ })

};
