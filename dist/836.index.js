export const id = 836;
export const ids = [836,394];
export const modules = {

/***/ 9836:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Av: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.Av),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.Qv),
/* harmony export */   SE: () => (/* binding */ setupCondaCompiler),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.Se),
/* harmony export */   Up: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.Up),
/* harmony export */   Xv: () => (/* binding */ configureWindowsCompiler),
/* harmony export */   dV: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.dV),
/* harmony export */   lM: () => (/* reexport safe */ _msvc_js__WEBPACK_IMPORTED_MODULE_1__.l),
/* harmony export */   oB: () => (/* binding */ assertWindows),
/* harmony export */   qY: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.qY),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.s6),
/* harmony export */   uU: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.uU),
/* harmony export */   wu: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.wu),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_0__.zk)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9674);
/* harmony import */ var _msvc_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1394);






function assertWindows() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .assertPlatform */ .G6)('win32', 'This setup script is only supported on Windows.');
}

async function setupCondaCompiler({
  version = '',
  versionedPackages = [],
  packages = [],
  channels,
  compilers,
  requiresMsvc = false,
  additionalVerificationCommands = [],
  createConfiguration = () => ({}),
}) {
  assertWindows();

  if (requiresMsvc) {
    await (0,_msvc_js__WEBPACK_IMPORTED_MODULE_1__/* .initializeMsvcEnvironment */ .l)();
  }

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .installCondaCompilerPackages */ .dF)({
    version,
    versionedPackages,
    packages,
    channels,
  });

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .getCondaPrefix */ .s6)();
  const configuration = await createConfiguration(condaPrefix);
  await configureWindowsCompiler({
    paths: configuration.paths || (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .getCondaExecutablePaths */ .wu)(condaPrefix),
    compilers,
    environment: configuration.environment,
    additionalVerificationCommands,
  });
}

async function configureWindowsCompiler({
  paths,
  compilers,
  environment = {},
  additionalVerificationCommands = [],
}) {
  assertWindows();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .addExistingPaths */ .Bf)(paths);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .verifyCommands */ .I6)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .createCompilerVerificationCommands */ .dQ)(
      compilers,
      additionalVerificationCommands,
    ),
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .createCompilerEnvironment */ .Tp)(
      compilers.fortran,
      compilers.c,
      compilers.cxx,
      environment,
    ),
  );

  (0,_common_js__WEBPACK_IMPORTED_MODULE_0__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ }),

/***/ 1394:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   l: () => (/* binding */ initializeMsvcEnvironment)
/* harmony export */ });
/* unused harmony export createMsvcCommandArguments */
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _lib_action_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9766);






const MSVC_ENVIRONMENT_VARIABLES = Object.freeze([
  'PATH',
  'TMP',
  'INCLUDE',
  'LIB',
  'LIBPATH',
]);

async function commandExists(command) {
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', [command], { silent: true });
    return true;
  } catch {
    return false;
  }
}

function createMsvcCommandArguments(vcvarsPath) {
  const args = ['/d', '/c', 'call', vcvarsPath, '>nul'];
  for (const name of MSVC_ENVIRONMENT_VARIABLES) {
    args.push('&&', 'set', name);
  }
  return args;
}

function parseMsvcEnvironment(output) {
  const parsedValues = new Map();

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).toUpperCase();
    if (!MSVC_ENVIRONMENT_VARIABLES.includes(key)) {
      continue;
    }
    parsedValues.set(key, line.slice(separator + 1));
  }

  const environment = {};
  for (const name of MSVC_ENVIRONMENT_VARIABLES) {
    const value = parsedValues.get(name);
    if (!value) {
      throw new Error(`vcvars64.bat did not define ${name}`);
    }
    environment[name] = value;
  }

  return environment;
}

async function initializeMsvcEnvironment() {
  if (!(await commandExists('vswhere'))) {
    throw new Error(
      '"vswhere" not found in PATH. Ensure Visual Studio is installed.',
    );
  }

  const vcvarsPath = await (0,_lib_action_js__WEBPACK_IMPORTED_MODULE_4__/* .runInGroup */ .Se)(
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
        },
      );

      vsPath = vsPath.trim();
      if (!vsPath) {
        throw new Error('vswhere did not return any installation path');
      }

      const resolvedPath = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(
        vsPath,
        'VC',
        'Auxiliary',
        'Build',
        'vcvars64.bat',
      );
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Found Visual Studio: ${vsPath}`);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved vcvars64.bat: ${resolvedPath}`);
      return resolvedPath;
    },
  );

  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(vcvarsPath)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvarsPath}`);
  }

  const output = await (0,_lib_action_js__WEBPACK_IMPORTED_MODULE_4__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Initialize MSVC Environment',
    async () => {
      let captured = '';
      const exitCode = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(
        'cmd.exe',
        createMsvcCommandArguments(vcvarsPath),
        {
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
        },
      );

      if (exitCode !== 0) {
        throw new Error(
          `vcvars64.bat failed with code ${exitCode}:\n${captured}`,
        );
      }
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('vcvars64.bat ran successfully');
      return captured;
    },
  );

  const environment = parseMsvcEnvironment(output);
  await (0,_lib_action_js__WEBPACK_IMPORTED_MODULE_4__/* .exportEnvironment */ .qw)(
    environment,
    'setup-fortran-conda: Export MSVC Environment',
  );
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(
    `MSVC environment loaded with ${Object.keys(environment).length} variables`,
  );
}


/***/ })

};
