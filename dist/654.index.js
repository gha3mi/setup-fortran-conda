export const id = 654;
export const ids = [654,994];
export const modules = {

/***/ 994:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Bf),
/* harmony export */   EE: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.EE),
/* harmony export */   HD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.HD),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.MA),
/* harmony export */   QK: () => (/* binding */ setLinuxUlimits),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Qv),
/* harmony export */   b4: () => (/* binding */ assertLinux),
/* harmony export */   pI: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.pI),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.x7),
/* harmony export */   zD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.zD)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7174);








function assertLinux(
  message = 'This setup script is only supported on Linux.'
) {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .assertPlatform */ .G6)('linux', message);
}

async function setLinuxUlimits() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .grouped */ .zD)('setup-fortran-conda: Configure Linux Environment', async () => {
    const command =
      'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
    const script = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(process.env.RUNNER_TEMP, 'ulimit.sh');
    (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.appendFileSync)(script, `${command}${node_os__WEBPACK_IMPORTED_MODULE_2__.EOL}`);
    (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.appendFileSync)(process.env.GITHUB_ENV, `BASH_ENV=${script}${node_os__WEBPACK_IMPORTED_MODULE_2__.EOL}`);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
  });
}


/***/ }),

/***/ 3654:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(994);




const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertLinux */ .b4)();

  const packages = [
    version ? `ifx_linux-64=${version}` : 'ifx_linux-64',
    version ? `intel-fortran-rt=${version}` : 'intel-fortran-rt',
    version ? `dpcpp-cpp-rt=${version}` : 'dpcpp-cpp-rt',
    version ? `dpcpp_linux-64=${version}` : 'dpcpp_linux-64',
    version ? `intel-sycl-rt=${version}` : 'intel-sycl-rt',
    'llvm-openmp',
  ];
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .installCondaPackages */ .MA)(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .showCondaEnvironment */ .Qv)();

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'bin')]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .verifyCommands */ .I6)([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .compilerEnvironment */ .HD)('ifx', 'icx', 'icx', {
      LD_LIBRARY_PATH: [(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'lib'), process.env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
    })
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .setLinuxUlimits */ .QK)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportProcessEnvironment */ .pI)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
