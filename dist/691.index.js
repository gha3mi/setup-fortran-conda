export const id = 691;
export const ids = [691,673];
export const modules = {

/***/ 9673:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Aq: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Aq),
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Bf),
/* harmony export */   EE: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.EE),
/* harmony export */   HD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.HD),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Qv),
/* harmony export */   RB: () => (/* binding */ windowsCondaPaths),
/* harmony export */   lM: () => (/* binding */ initializeMsvcEnvironment),
/* harmony export */   oB: () => (/* binding */ assertWindows),
/* harmony export */   pI: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.pI),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.x7),
/* harmony export */   zD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.zD)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7174);








function assertWindows() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .assertPlatform */ .G6)('win32', 'This setup script is only supported on Windows.');
}

async function commandExists(command) {
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', [command], { silent: true });
    return true;
  } catch {
    return false;
  }
}

async function initializeMsvcEnvironment() {
  if (!(await commandExists('vswhere'))) {
    throw new Error(
      '"vswhere" not found in PATH. Ensure Visual Studio is installed.'
    );
  }

  const vcvars = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .grouped */ .zD)(
    'setup-fortran-conda: Detect Visual Studio Installation',
    async () => {
      let vsPath = '';
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(
        'vswhere',
        [
          '-latest',
          '-products',
          '*',
          '-requires',
          'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
          '-property',
          'installationPath',
        ],
        {
          silent: true,
          listeners: {
            stdout: (data) => {
              vsPath += data.toString();
            },
          },
        }
      );

      vsPath = vsPath.trim();
      if (!vsPath) {
        throw new Error('vswhere did not return any installation path');
      }

      const path = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(vsPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Found Visual Studio: ${vsPath}`);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved vcvars64.bat: ${path}`);
      return path;
    }
  );

  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(vcvars)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvars}`);
  }

  const output = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .grouped */ .zD)(
    'setup-fortran-conda: Initialize MSVC Environment',
    async () => {
      let captured = '';
      const exitCode = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('cmd.exe', ['/c', vcvars, '&&', 'set'], {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
          stdout: (data) => {
            captured += data.toString();
          },
          stderr: (data) => {
            captured += data.toString();
          },
        },
      });

      if (exitCode !== 0) {
        throw new Error(
          `vcvars64.bat failed with code ${exitCode}:\n${captured}`
        );
      }
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('vcvars64.bat ran successfully');
      return captured;
    }
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .grouped */ .zD)('setup-fortran-conda: Export MSVC Environment', async () => {
    let exportedCount = 0;
    for (const line of output.split('\n')) {
      const [key, ...rest] = line.trim().split('=');
      if (!key || rest.length === 0) continue;

      (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportEnv */ .EE)(key, rest.join('='));
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      exportedCount += 1;
    }
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`MSVC environment loaded with ${exportedCount} variables`);
  });
}

function windowsCondaPaths(prefix) {
  return [
    (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'Library', 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'Library', 'usr', 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'Scripts'),
  ];
}


/***/ }),

/***/ 691:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9673);




const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertWindows */ .oB)();

  const packages = [
    version ? `ifx_win-64=${version}` : 'ifx_win-64',
    version ? `intel-fortran-rt=${version}` : 'intel-fortran-rt',
    version ? `dpcpp-cpp-rt=${version}` : 'dpcpp-cpp-rt',
    version ? `dpcpp_win-64=${version}` : 'dpcpp_win-64',
    version ? `intel-sycl-rt=${version}` : 'intel-sycl-rt',
    'llvm-openmp',
  ];

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .initializeMsvcEnvironment */ .lM)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .installCondaPackages */ .MA)(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .showCondaEnvironment */ .Qv)();

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .addExistingPaths */ .Bf)((0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .windowsCondaPaths */ .RB)(prefix));
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .verifyCommands */ .I6)([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .compilerEnvironment */ .HD)('ifx', 'icx', 'icx', {
      INCLUDE: [
        (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'opt', 'compiler', 'include', 'intel64'),
        (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'Library', 'include'),
        process.env.INCLUDE || '',
      ]
        .filter(Boolean)
        .join(';'),
      LIB: [(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'Library', 'lib'), process.env.LIB || '']
        .filter(Boolean)
        .join(';'),
    })
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportProcessEnvironment */ .pI)({ warningPrefix: '' });

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
