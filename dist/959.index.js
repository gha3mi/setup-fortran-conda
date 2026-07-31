export const id = 959;
export const ids = [959,836];
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

/***/ 2959:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9836);





const COMPILER_ENVIRONMENT_NAME = 'setup-fortran-conda-lfortran';

async function removeConflictingLinkers() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .runInGroup */ .Se)('setup-fortran-conda: Clean Up PATH', async () => {
    const filteredPaths = String(process.env.PATH || '')
      .split(';')
      .filter(
        (pathEntry) =>
          !/mingw/i.test(pathEntry) &&
          !/strawberry[\\/]c[\\/]bin/i.test(pathEntry),
      );
    (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .exportEnvironmentVariable */ .qY)('PATH', filteredPaths.join(';'));
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Removed conflicting linkers (MinGW, Strawberry Perl) from PATH');
  });
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .assertWindows */ .oB)();

  const packages = [
    (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .createCondaPackageSpec */ .zk)('lfortran', version),
    ...(version ? [] : ['zstd=1.5.6']),
    'llvm',
    'llvm-tools',
    'clang-tools',
    'clangxx',
    'llvm-openmp',
    'lld',
    'gcc',
  ];
  let compilerPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .getCondaPrefix */ .s6)(COMPILER_ENVIRONMENT_NAME, false);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .initializeMsvcEnvironment */ .lM)();
  await removeConflictingLinkers();

  const condaCommand = compilerPrefix ? 'install' : 'create';
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .installCondaPackages */ .MA)(packages, {
    environmentName: COMPILER_ENVIRONMENT_NAME,
    command: condaCommand,
    commandOptions: condaCommand === 'create' ? ['--no-default-packages'] : [],
    successMessage: `Conda packages installed in ${COMPILER_ENVIRONMENT_NAME}`,
    errorMessage: 'Conda compiler environment setup failed',
  });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .showCondaEnvironment */ .Qv)([
    _common_js__WEBPACK_IMPORTED_MODULE_3__/* .TOOLS_ENVIRONMENT_NAME */ .uU,
    COMPILER_ENVIRONMENT_NAME,
  ]);

  compilerPrefix ||= await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .getCondaPrefix */ .s6)(COMPILER_ENVIRONMENT_NAME);
  const toolsPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .getCondaPrefix */ .s6)(_common_js__WEBPACK_IMPORTED_MODULE_3__/* .TOOLS_ENVIRONMENT_NAME */ .uU);
  const variantBinDirectory = ['ucrt64', 'clang64', 'mingw64', 'clangarm64']
    .map((variant) => (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', variant, 'bin'))
    .find((candidate) => (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)(candidate));

  const compilerPaths = [
    variantBinDirectory,
    (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'mingw-w64', 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'usr', 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'bin'),
    (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'bin'),
  ]
    .filter((candidate) => candidate && (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)(candidate))
    .reverse();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .addExistingPaths */ .Bf)(compilerPaths);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .verifyCommands */ .I6)([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .createCompilerEnvironment */ .Tp)('lfortran', 'clang', 'clang++', {
      INCLUDE: (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .prependPathEntries */ .Up)(
        [
          (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(toolsPrefix, 'Library', 'include'),
          (0,node_path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'include'),
        ],
        process.env.INCLUDE,
      ),
      LFORTRAN_LINKER: 'gcc',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      CMAKE_LINKER: 'lld',
    }),
  );

  (0,_common_js__WEBPACK_IMPORTED_MODULE_3__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ })

};
