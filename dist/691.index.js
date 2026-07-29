export const id = 691;
export const ids = [691,673];
export const modules = {

/***/ 7174:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Aq: () => (/* binding */ TOOLS_ENVIRONMENT),
/* harmony export */   Bf: () => (/* binding */ addExistingPaths),
/* harmony export */   EE: () => (/* binding */ exportEnv),
/* harmony export */   G6: () => (/* binding */ assertPlatform),
/* harmony export */   HD: () => (/* binding */ compilerEnvironment),
/* harmony export */   I6: () => (/* binding */ verifyCommands),
/* harmony export */   MA: () => (/* binding */ installCondaPackages),
/* harmony export */   Qv: () => (/* binding */ showCondaEnvironment),
/* harmony export */   pI: () => (/* binding */ exportProcessEnvironment),
/* harmony export */   s6: () => (/* binding */ getCondaPrefix),
/* harmony export */   x7: () => (/* binding */ exportCompilerEnvironment),
/* harmony export */   zD: () => (/* binding */ grouped)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);






const TOOLS_ENVIRONMENT = 'fortran';

function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

async function grouped(name, operation) {
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)(name);
  try {
    return await operation();
  } finally {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
  }
}

function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');

  const normalized = String(value);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(envFile, `${key}=${normalized}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
  process.env[key] = normalized;
}

function compilerEnvironment(fortran, c, cxx, extra = {}) {
  return {
    FC: fortran,
    CC: c,
    CXX: cxx,
    FPM_FC: fortran,
    FPM_CC: c,
    FPM_CXX: cxx,
    CMAKE_Fortran_COMPILER: fortran,
    CMAKE_C_COMPILER: c,
    CMAKE_CXX_COMPILER: cxx,
    ...extra,
  };
}

async function exportCompilerEnvironment(values) {
  await grouped('setup-fortran-conda: Export Compiler Environment', async () => {
    for (const [key, value] of Object.entries(values)) {
      exportEnv(key, value);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
    }
  });
}

async function exportProcessEnvironment({ warningPrefix = '⚠️ ' } = {}) {
  await grouped('setup-fortran-conda: Export Process Environment', async () => {
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value !== 'string') continue;

      try {
        process.env[key] = value;
        (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(process.env.GITHUB_ENV, `${key}=${value}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      } catch (error) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`${warningPrefix}Failed to export: ${key} (${error.message})`);
      }
    }
  });
}

async function getCondaPrefix(
  envName = TOOLS_ENVIRONMENT,
  required = true
) {
  let output = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
    },
  });

  const { envs = [] } = JSON.parse(output);
  const prefix = envs.find(
    (candidate) =>
      candidate.endsWith(node_path__WEBPACK_IMPORTED_MODULE_4__.sep + envName) || candidate.endsWith('/' + envName)
  );

  if (!prefix && required) {
    throw new Error(`Unable to locate Conda environment "${envName}".`);
  }
  return prefix || '';
}

async function installCondaPackages(
  packages,
  {
    envName = TOOLS_ENVIRONMENT,
    channels = ['conda-forge'],
    command = 'install',
    commandOptions = [],
    successMessage = 'Conda packages installed',
    errorMessage = 'Conda install failed',
  } = {}
) {
  await grouped('setup-fortran-conda: Install Conda Packages', async () => {
    try {
      const args = [
        command,
        ...commandOptions,
        '--yes',
        '--name',
        envName,
        ...packages,
      ];
      for (const channel of channels) args.push('-c', channel);

      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', args);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(successMessage);
    } catch (error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  });
}

async function showCondaEnvironment(envNames = [TOOLS_ENVIRONMENT]) {
  await grouped('setup-fortran-conda: Show Conda Environment', async () => {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['info']);
    for (const envName of envNames) {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['list', '--name', envName]);
    }
  });
}

async function addExistingPaths(paths, { log = true } = {}) {
  await grouped('setup-fortran-conda: Configure Compiler Paths', async () => {
    for (const path of paths) {
      if (!path || !(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(path)) continue;

      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(path);
      if (log) (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${path}`);
    }
  });
}

async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await grouped('setup-fortran-conda: Verify Compiler Commands', async () => {
    for (const { command, args } of commands) {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(lookupCommand, [command]);
      if (args) await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(command, args);
    }
  });
}


/***/ }),

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
      INCLUDE: [(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'Library', 'include'), process.env.INCLUDE || '']
        .filter(Boolean)
        .join(';'),
    })
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportProcessEnvironment */ .pI)({ warningPrefix: '' });

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
