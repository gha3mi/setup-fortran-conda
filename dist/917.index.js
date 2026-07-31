export const id = 917;
export const ids = [917];
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


/***/ })

};
