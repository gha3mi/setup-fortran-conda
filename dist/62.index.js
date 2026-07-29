export const id = 62;
export const ids = [62,994,921];
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

/***/ 5062:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* reexport safe */ _flang_js__WEBPACK_IMPORTED_MODULE_0__.setup)
/* harmony export */ });
/* harmony import */ var _flang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6921);



/***/ }),

/***/ 6921:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(994);




async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertLinux */ .b4)();

  const packages = [
    version ? `flang=${version}` : 'flang',
    version ? `clangxx=${version}` : 'clangxx',
    'libflang-rt',
  ];
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .installCondaPackages */ .MA)(packages);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .showCondaEnvironment */ .Qv)();

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'bin')]);

  const ldLibraryPath = [
    (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(prefix, 'lib'),
    process.env.LD_LIBRARY_PATH || '',
  ]
    .filter(Boolean)
    .join(':');
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportEnv */ .EE)('LD_LIBRARY_PATH', ldLibraryPath);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Set LD_LIBRARY_PATH → ${ldLibraryPath}`);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .verifyCommands */ .I6)([
    { command: 'flang', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .compilerEnvironment */ .HD)('flang', 'clang', 'clang++', {
      LD_LIBRARY_PATH: ldLibraryPath,
    })
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .setLinuxUlimits */ .QK)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportProcessEnvironment */ .pI)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
