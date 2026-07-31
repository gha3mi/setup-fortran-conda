export const id = 671;
export const ids = [671,564];
export const modules = {

/***/ 5564:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Bf),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Qv),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Se),
/* harmony export */   Tp: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Tp),
/* harmony export */   WQ: () => (/* binding */ configureMacOsSdkRoot),
/* harmony export */   Ys: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Ys),
/* harmony export */   eI: () => (/* binding */ assertMacOs),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.x7),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.zk)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _lib_command_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7819);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9674);






function assertMacOs() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertPlatform */ .G6)('darwin', 'This setup script is only supported on macOS.');
}

async function configureMacOsSdkRoot() {
  const result = await (0,_lib_command_js__WEBPACK_IMPORTED_MODULE_1__/* .captureCommand */ .g)('xcrun', [
    '--sdk',
    'macosx',
    '--show-sdk-path',
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`Unable to detect macOS SDK path: ${result.stderr}`);
  }

  const sdkPath = result.stdout.trim();
  if (sdkPath) {
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportEnvironmentVariable */ .qY)('SDKROOT', sdkPath);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('macOS SDK path was empty; SDKROOT was not exported');
  }
}


/***/ }),

/***/ 4671:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5564);



async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .assertMacOs */ .eI)();

  const packages = [
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCondaPackageSpec */ .zk)('lfortran', version),
    'git',
    'llvm',
    'llvm-tools',
    'clangxx',
    'clang-tools',
    'llvm-openmp',
  ];
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .installCondaPackages */ .MA)(packages);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .showCondaEnvironment */ .Qv)();

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_0__.join)(condaPrefix, 'bin')], { log: false });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .configureMacOsSdkRoot */ .WQ)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .verifyCommands */ .I6)([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
    { command: 'llvm-ar' },
    { command: 'llvm-ranlib' },
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .createCompilerEnvironment */ .Tp)('lfortran', 'clang', 'clang++', {
      FPM_AR: 'llvm-ar -c',
      AR: 'llvm-ar',
      RANLIB: 'llvm-ranlib',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      LFORTRAN_LINKER: 'clang',
    }),
  );

  (0,_common_js__WEBPACK_IMPORTED_MODULE_1__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ })

};
