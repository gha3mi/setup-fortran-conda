export const id = 486;
export const ids = [486,410];
export const modules = {

/***/ 410:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Bf),
/* harmony export */   HD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.HD),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Qv),
/* harmony export */   eI: () => (/* binding */ assertMacOs),
/* harmony export */   gT: () => (/* binding */ setMacOsSdkRoot),
/* harmony export */   pI: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.pI),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.x7),
/* harmony export */   zD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.zD)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7174);






function assertMacOs() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertPlatform */ .G6)('darwin', 'This setup script is only supported on macOS.');
}

async function setMacOsSdkRoot() {
  let sdkPath = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        sdkPath += data.toString();
      },
    },
  });

  sdkPath = sdkPath.trim();
  if (sdkPath) {
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportEnv */ .EE)('SDKROOT', sdkPath);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('⚠️ Failed to detect macOS SDK path.');
  }
}


/***/ }),

/***/ 2486:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(410);






async function detectHomebrewGcc() {
  let prefix = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['--prefix'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        prefix += data.toString();
      },
    },
  });

  const bin = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix.trim(), 'bin');
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(bin)) {
    throw new Error(`Homebrew bin directory not found: ${bin}`);
  }

  const versions = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(bin)
    .filter((name) => name.startsWith('gcc-'))
    .map((name) => Number.parseInt(name.replace('gcc-', ''), 10))
    .filter(Number.isFinite);
  if (!versions.length) {
    throw new Error(`No versioned Homebrew gcc executable found in ${bin}`);
  }
  return `gcc-${Math.max(...versions)}`;
}

function filesNamed(root, name, depth = 0) {
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(root) || depth > 3) return [];

  const matches = [];
  for (const entry of (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(root, { withFileTypes: true })) {
    const path = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(root, entry.name);
    if (entry.isDirectory()) {
      matches.push(...filesNamed(path, name, depth + 1));
    } else if (entry.isFile() && entry.name === name) {
      matches.push(path);
    }
  }
  return matches;
}

function configureCondaGfortranRpath(prefix) {
  const libraryPath = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'lib');
  let changed = 0;

  for (const path of filesNamed((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'lib', 'gcc'), 'specs')) {
    const content = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readFileSync)(path, 'utf8');
    const updated = content.replace(
      /(\*darwin_rpaths:\r?\n)[^\r\n]*/,
      (_, header) => `${header}%{!static:-rpath ${libraryPath}}`
    );
    if (updated === content) continue;

    (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.writeFileSync)(path, updated);
    changed += 1;
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Configured macOS gfortran RPATH in ${changed} GCC specs file(s)`);
}

async function installHomebrewGcc(version) {
  return (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .grouped */ .zD)('setup-fortran-conda: Install Homebrew GCC', async () => {
    try {
      if (version) {
        const major = version.split('.')[0];
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', `gcc@${major}`], { silent: true });
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Homebrew gcc@${major} installed`);
        return { c: `gcc-${major}`, cxx: `g++-${major}` };
      }

      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', 'gcc'], { silent: true });
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Homebrew latest gcc installed');
      const c = await detectHomebrewGcc();
      return { c, cxx: c.replace('gcc', 'g++') };
    } catch (error) {
      throw new Error(`Homebrew gcc install failed: ${error.message}`);
    }
  });
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .assertMacOs */ .eI)();

  const { c, cxx } = await installHomebrewGcc(version);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .installCondaPackages */ .MA)([
    version ? `gfortran=${version}` : 'gfortran',
    'binutils',
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .showCondaEnvironment */ .Qv)();

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .getCondaPrefix */ .s6)();
  configureCondaGfortranRpath(prefix);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .addExistingPaths */ .Bf)([(0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(prefix, 'bin')], { log: false });
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .setMacOsSdkRoot */ .gT)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .verifyCommands */ .I6)([
    { command: 'gfortran', args: ['--version'] },
    { command: c, args: ['--version'] },
    { command: cxx, args: ['--version'] },
  ]);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .compilerEnvironment */ .HD)('gfortran', c, cxx)
  );
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportProcessEnvironment */ .pI)({ warningPrefix: '' });

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
