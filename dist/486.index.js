export const id = 486;
export const ids = [486];
export const modules = {

/***/ 2486:
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







// Export a key=value pair to GitHub Actions' environment and current process.env
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
    listeners: { stdout: d => (raw += d.toString()) }
  });

  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(path__WEBPACK_IMPORTED_MODULE_2__.sep + envName) || p.endsWith('/' + envName)) return p;
  }

  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

// Set macOS SDK path for compiler compatibility
async function setMacOSSDKROOT() {
  let sdkPath = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: { stdout: d => (sdkPath += d.toString()) }
  });

  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportEnv('SDKROOT', sdkPath);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('⚠️ Failed to detect macOS SDK path.');
  }
}

// Detect the latest Homebrew GCC version (e.g., gcc-13, gcc-14, etc.)
function detectHomebrewGccVersion() {
  const binDir = '/opt/homebrew/bin';
  const gccVersions = (0,fs__WEBPACK_IMPORTED_MODULE_3__.readdirSync)(binDir)
    .filter(f => f.startsWith('gcc-'))
    .map(f => parseInt(f.replace('gcc-', '')))
    .filter(Number.isFinite);
  const latest = Math.max(...gccVersions);
  return `gcc-${latest}`;
}

// Main setup function
async function setup(version = '') {
  if (process__WEBPACK_IMPORTED_MODULE_5__.platform !== 'darwin') {
    throw new Error('This setup script is only supported on macOS.');
  }

  // Install Homebrew GCC
  let gcc = '';
  let gpp = '';
  let major = '';

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install Homebrew GCC');
  try {
    if (version) {
      major = version.split('.')[0];
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', `gcc@${major}`], { silent: true });
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Homebrew gcc@${major} installed`);
      gcc = `gcc-${major}`;
      gpp = `g++-${major}`;
    } else {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('brew', ['install', 'gcc'], { silent: true });
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Homebrew latest gcc installed');
      gcc = detectHomebrewGccVersion();       // e.g., "gcc-14"
      gpp = gcc.replace('gcc', 'g++');        // e.g., "g++-14"
      major = gcc.split('-')[1];              // extract "14" from "gcc-14"
    }
  } catch (err) {
    throw new Error(`Homebrew gcc install failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Install gfortran via Conda
  const Pkg = version ? `gfortran=${version}` : 'gfortran';
  const packages = [Pkg, 'binutils'];

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

  // Add Conda bin path to PATH
  const prefix = await getCondaPrefix('fortran');
  const binPath = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(prefix, 'bin');
  const libPath = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(prefix, 'lib');

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Compiler Paths');
  const paths = [binPath];
  for (const p of paths) {
    if ((0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(p);
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  await setMacOSSDKROOT();

  // Verify compiler versions
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Verify Compiler Commands');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['gfortran']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('gfortran', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', [gcc]);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(gcc, ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', [gpp]);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(gpp, ['--version']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Export compiler-related environment variables
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    FC: 'gfortran',
    CC: gcc,
    CXX: gpp,
    FPM_FC: 'gfortran',
    FPM_CC: gcc,
    FPM_CXX: gpp,
    CMAKE_Fortran_COMPILER: 'gfortran',
    CMAKE_C_COMPILER: gcc,
    CMAKE_CXX_COMPILER: gpp
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Export all environment variables to process.env and GITHUB_ENV
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Process Environment');
  for (const [key, value] of Object.entries(process__WEBPACK_IMPORTED_MODULE_5__.env)) {
    if (typeof value === 'string') {
      try {
        process.env[key] = value;
        (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(process.env.GITHUB_ENV, `${key}=${value}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      } catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Failed to export: ${key} (${err.message})`);
      }
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
