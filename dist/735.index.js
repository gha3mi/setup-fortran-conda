export const id = 735;
export const ids = [735,917];
export const modules = {

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

/***/ 3735:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(917);



const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .assertLinux */ .b4)();

  const packages = [
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('ifx_linux-64', version),
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('intel-fortran-rt', version),
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('dpcpp-cpp-rt', version),
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('dpcpp_linux-64', version),
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('intel-sycl-rt', version),
    'llvm-openmp',
  ];
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .installCondaPackages */ .MA)(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .showCondaEnvironment */ .Qv)();

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_0__.join)(condaPrefix, 'bin')]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .verifyCommands */ .I6)([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCompilerEnvironment */ .Tp)('ifx', 'icx', 'icx', {
      LD_LIBRARY_PATH: (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .prependPathEntries */ .Up)(
        [(0,node_path__WEBPACK_IMPORTED_MODULE_0__.join)(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    }),
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .configureLinuxUlimits */ .O7)();

  (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ })

};
