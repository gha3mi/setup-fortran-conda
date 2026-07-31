export const id = 872;
export const ids = [872,564];
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

/***/ 4872:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _lib_command_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7819);
/* harmony import */ var _lib_environment_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(3775);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(7507);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5564);









async function detectHomebrewGccCommand() {
  const result = await (0,_lib_command_js__WEBPACK_IMPORTED_MODULE_4__/* .captureCommand */ .g)('brew', ['--prefix']);
  if (result.exitCode !== 0) {
    throw new Error(`Unable to detect Homebrew prefix: ${result.stderr}`);
  }

  const binDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(result.stdout.trim(), 'bin');
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(binDirectory)) {
    throw new Error(`Homebrew bin directory not found: ${binDirectory}`);
  }

  const versions = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(binDirectory)
    .filter((name) => name.startsWith('gcc-'))
    .map((name) => Number.parseInt(name.replace('gcc-', ''), 10))
    .filter(Number.isFinite);
  if (!versions.length) {
    throw new Error(
      `No versioned Homebrew gcc executable found in ${binDirectory}`,
    );
  }
  return `gcc-${Math.max(...versions)}`;
}

function hasCondaGccSpecs(root) {
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(root)) {
    return false;
  }

  return (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(root, { withFileTypes: true }).some((entry) => {
    if (entry.isFile()) {
      return entry.name === 'conda.specs';
    }
    return entry.isDirectory() && hasCondaGccSpecs((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(root, entry.name));
  });
}

function createCondaGfortranEnvironment(condaPrefix) {
  if (!hasCondaGccSpecs((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(condaPrefix, 'lib', 'gcc'))) {
    return {};
  }

  const flag = '-nodefaultrpaths';
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Using Conda gfortran RPATH without duplicate GCC defaults');
  return {
    FFLAGS: (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_5__/* .prependFlag */ .z)(flag, process.env.FFLAGS),
    FPM_LDFLAGS: (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_5__/* .prependFlag */ .z)(flag, process.env.FPM_LDFLAGS),
  };
}

async function installHomebrewGcc(version) {
  return (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)('setup-fortran-conda: Install Homebrew GCC', async () => {
    try {
      if (version) {
        const majorVersion = version.split('.')[0];
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', `gcc@${majorVersion}`], {
          silent: true,
        });
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Homebrew gcc@${majorVersion} installed`);
        return {
          cCompiler: `gcc-${majorVersion}`,
          cxxCompiler: `g++-${majorVersion}`,
        };
      }

      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', 'gcc'], { silent: true });
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Homebrew latest gcc installed');
      const cCompiler = await detectHomebrewGccCommand();
      return {
        cCompiler,
        cxxCompiler: cCompiler.replace('gcc', 'g++'),
      };
    } catch (error) {
      throw new Error(
        `Homebrew gcc install failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_7__/* .getErrorMessage */ .u)(error)}`,
        { cause: error },
      );
    }
  });
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .assertMacOs */ .eI)();

  const { cCompiler, cxxCompiler } = await installHomebrewGcc(version);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .installCondaPackages */ .MA)([
    (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .createCondaPackageSpec */ .zk)('gfortran', version),
    'binutils',
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .showCondaEnvironment */ .Qv)();

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .getCondaPrefix */ .s6)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(condaPrefix, 'bin')], { log: false });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .configureMacOsSdkRoot */ .WQ)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .verifyCommands */ .I6)([
    { command: 'gfortran', args: ['--version'] },
    { command: cCompiler, args: ['--version'] },
    { command: cxxCompiler, args: ['--version'] },
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .createCompilerEnvironment */ .Tp)(
      'gfortran',
      cCompiler,
      cxxCompiler,
      createCondaGfortranEnvironment(condaPrefix),
    ),
  );

  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ })

};
