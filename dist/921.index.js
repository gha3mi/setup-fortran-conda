export const id = 921;
export const ids = [921];
export const modules = {

/***/ 6921:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7264);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6928);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9896);
/* harmony import */ var os__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(857);
/* harmony import */ var process__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(932);







// Export a key=value pair to GITHUB_ENV and process.env
function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(envFile, `${key}=${value}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  process__WEBPACK_IMPORTED_MODULE_5__.env[key] = value;
}

// Resolve the absolute path of a named conda environment
async function getCondaPrefix(envName) {
  let raw = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: (d) => (raw += d.toString()) }
  });

  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(path__WEBPACK_IMPORTED_MODULE_2__.sep + envName) || p.endsWith('/' + envName)) return p;
  }

  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

// Optional: Set unlimited ulimits for Linux
function setLinuxUlimits() {
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Linux Environment');
  const ulimitCmd =
    'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
  const script = `${process.env.RUNNER_TEMP}/ulimit.sh`;
  (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(script, `${ulimitCmd}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(process.env.GITHUB_ENV, `BASH_ENV=${script}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

// Main setup function
async function setup(version = '') {
  if (process__WEBPACK_IMPORTED_MODULE_5__.platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  // Define the set of Conda packages to install
  const packages = [
    version ? `flang=${version}` : 'flang',
    version ? `clangxx=${version}` : 'clangxx',
    'libflang-rt'
  ];

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install Conda Packages');
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', [
      'install',
      '--yes',
      '--name',
      'fortran',
      ...packages,
      '-c',
      'conda-forge'
    ]);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Conda packages installed');
  } catch (err) {
    throw new Error(`Conda install failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Conda environment information
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Show Conda Environment');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['info']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['list', '--name', 'fortran']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Add Conda bin paths to PATH so tools are usable
  const prefix = await getCondaPrefix('fortran');
  const binPath = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(prefix, 'bin');
  const libPath = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(prefix, 'lib');

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Compiler Paths');
  const paths = [binPath];
  for (const p of paths) {
    if ((0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(p);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${p}`);
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Set LD_LIBRARY_PATH
  const ldPath = [libPath, process__WEBPACK_IMPORTED_MODULE_5__.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':');
  exportEnv('LD_LIBRARY_PATH', ldPath);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Set LD_LIBRARY_PATH → ${ldPath}`);

  // Verify that the compilers are installed and working
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Verify Compiler Commands');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['flang']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('flang', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['clang']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['clang++']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang++', ['--version']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Export compiler-related environment variables
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    FC: 'flang',
    CC: 'clang',
    CXX: 'clang++',
    FPM_FC: 'flang',
    FPM_CC: 'clang',
    FPM_CXX: 'clang++',
    CMAKE_Fortran_COMPILER: 'flang',
    CMAKE_C_COMPILER: 'clang',
    CMAKE_CXX_COMPILER: 'clang++',
    LD_LIBRARY_PATH: ldPath
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  setLinuxUlimits();

  // Export all environment variables to process.env and GITHUB_ENV
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Process Environment');
  for (const [key, value] of Object.entries(process__WEBPACK_IMPORTED_MODULE_5__.env)) {
    if (typeof value === 'string') {
      try {
        process.env[key] = value;
        (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(process.env.GITHUB_ENV, `${key}=${value}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      } catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`⚠️ Failed to export: ${key} (${err.message})`);
      }
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
