export const id = 344;
export const ids = [344,836,795];
export const modules = {

/***/ 9836:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Bf),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Qv),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Se),
/* harmony export */   Tp: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Tp),
/* harmony export */   Up: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Up),
/* harmony export */   Ys: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.Ys),
/* harmony export */   lM: () => (/* binding */ initializeMsvcEnvironment),
/* harmony export */   oB: () => (/* binding */ assertWindows),
/* harmony export */   qY: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.qY),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.s6),
/* harmony export */   uU: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.uU),
/* harmony export */   wu: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.wu),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.x7),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.zk)
/* harmony export */ });
/* unused harmony export createMsvcCommandArguments */
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9674);








const MSVC_ENVIRONMENT_VARIABLES = Object.freeze([
  'PATH',
  'TMP',
  'INCLUDE',
  'LIB',
  'LIBPATH',
]);

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

  const vcvarsPath = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .runInGroup */ .Se)(
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

  const output = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .runInGroup */ .Se)(
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
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportEnvironment */ .qw)(
    environment,
    'setup-fortran-conda: Export MSVC Environment',
  );
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(
    `MSVC environment loaded with ${Object.keys(environment).length} variables`,
  );
}


/***/ }),

/***/ 5344:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* reexport safe */ _flang_js__WEBPACK_IMPORTED_MODULE_0__.setup)
/* harmony export */ });
/* harmony import */ var _flang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(795);



/***/ }),

/***/ 795:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9836);




function getClangRuntimeLibraryPaths(condaPrefix) {
  const root = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(condaPrefix, 'Library', 'lib', 'clang');
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_0__.existsSync)(root)) {
    return [];
  }

  return (0,node_fs__WEBPACK_IMPORTED_MODULE_0__.readdirSync)(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((leftVersion, rightVersion) =>
      rightVersion.localeCompare(leftVersion, undefined, {
        numeric: true,
      }),
    )
    .map((version) => (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(root, version, 'lib', 'x86_64-pc-windows-msvc'))
    .filter((candidate) => (0,node_fs__WEBPACK_IMPORTED_MODULE_0__.existsSync)(candidate));
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertWindows */ .oB)();

  const packages = [
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .createCondaPackageSpec */ .zk)('flang', version),
    'flang-rt_win-64',
  ];
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .initializeMsvcEnvironment */ .lM)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .installCondaPackages */ .MA)(packages);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .showCondaEnvironment */ .Qv)();

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .getCondaPrefix */ .s6)();
  const libraryPath = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(condaPrefix, 'Library', 'lib');
  const runtimeLibraryPaths = getClangRuntimeLibraryPaths(condaPrefix);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .addExistingPaths */ .Bf)([
    ...(0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .getCondaExecutablePaths */ .wu)(condaPrefix),
    libraryPath,
    ...runtimeLibraryPaths,
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .verifyCommands */ .I6)([
    { command: 'flang', args: ['--version'] },
    { command: 'clang-cl', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .createCompilerEnvironment */ .Tp)('flang', 'clang-cl', 'clang-cl', {
      INCLUDE: (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .prependPathEntries */ .Up)(
        [(0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(condaPrefix, 'Library', 'include')],
        process.env.INCLUDE,
      ),
      LIB: (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .prependPathEntries */ .Up)(
        [...runtimeLibraryPaths, libraryPath],
        process.env.LIB,
      ),
      AR: 'lib.exe',
    }),
  );

  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ })

};
