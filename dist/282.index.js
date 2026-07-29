export const id = 282;
export const ids = [282];
export const modules = {

/***/ 282:
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







const TOOLS_ENV = 'fortran';
const COMPILER_ENV = 'setup-fortran-conda-lfortran';

// Export a key=value pair to GitHub Actions' environment and current process.env
function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(envFile, `${key}=${value}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  process__WEBPACK_IMPORTED_MODULE_5__.env[key] = value;
}

// Check if a given command exists in PATH using 'where' (Windows)
async function commandExists(cmd) {
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', [cmd], { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Locate Visual Studio installation and extract the MSVC build environment
async function runVcvars64() {
  // Ensure vswhere is available to find Visual Studio
  if (!(await commandExists('vswhere'))) {
    throw new Error('"vswhere" not found in PATH. Ensure Visual Studio is installed.');
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Detect Visual Studio Installation');

  // Query the latest Visual Studio installation path
  let vsPath = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('vswhere', [
    '-latest',
    '-products', '*',
    '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
    '-property', 'installationPath'
  ], {
    silent: true,
    listeners: {
      stdout: data => { vsPath += data.toString(); }
    }
  });

  vsPath = vsPath.trim();
  if (!vsPath) throw new Error('vswhere did not return any installation path');

  // Construct the path to vcvars64.bat
  const vcvars = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(vsPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Found Visual Studio: ${vsPath}`);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved vcvars64.bat: ${vcvars}`);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  if (!(0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(vcvars)) {
    throw new Error(`vcvars64.bat not found at expected path: ${vcvars}`);
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Initialize MSVC Environment');

  // Run vcvars64.bat and capture the resulting environment variables
  let output = '';
  const code = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('cmd.exe', ['/c', vcvars, '&&', 'set'], {
    silent: true,
    ignoreReturnCode: true,
    listeners: {
      stdout: data => { output += data.toString(); },
      stderr: data => { output += data.toString(); }
    }
  });

  if (code !== 0) {
    throw new Error(`vcvars64.bat failed with code ${code}:\n${output}`);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`vcvars64.bat ran successfully`);
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export MSVC Environment');

  // Parse and export environment variables line-by-line
  let exportedCount = 0;
  output.split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && rest.length > 0) {
      const value = rest.join('=');
      exportEnv(key, value);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      exportedCount++;
    }
  });

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`MSVC environment loaded with ${exportedCount} variables`);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

// Resolve the absolute path of a named conda environment
async function getCondaPrefix(envName, required = true) {
  let raw = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });

  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(path__WEBPACK_IMPORTED_MODULE_2__.sep + envName) || p.endsWith('/' + envName)) return p;
  }

  if (required) {
    throw new Error(`Unable to locate Conda environment "${envName}".`);
  }

  return '';
}

// Remove any bad linkers from PATH to avoid conflicts
function removeBadLinkersFromPath() {

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Clean Up PATH');
  const paths = process__WEBPACK_IMPORTED_MODULE_5__.env.PATH.split(';');
  const filtered = paths.filter(p =>
    !/mingw/i.test(p) &&
    !/strawberry[\\\/]c[\\\/]bin/i.test(p)
  );
  process__WEBPACK_IMPORTED_MODULE_5__.env.PATH = filtered.join(';');

  const envFile = process.env.GITHUB_ENV;
  if (envFile) {
    (0,fs__WEBPACK_IMPORTED_MODULE_3__.appendFileSync)(envFile, `PATH=${process__WEBPACK_IMPORTED_MODULE_5__.env.PATH}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('Removed conflicting linkers (MinGW, Strawberry Perl) from PATH');
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

// Main setup function to configure compilers and environment
async function setup(version = '') {
  // Ensure this only runs on Windows
  if (process__WEBPACK_IMPORTED_MODULE_5__.platform !== 'win32') {
    throw new Error('This setup script is only supported on Windows.');
  }

  // Define the set of Conda packages to install
  const Pkg = version ? `lfortran=${version}` : 'lfortran';
  const packages = [Pkg, ...(version ? [] : ['zstd=1.5.6']), 'llvm', 'clang-tools', 'clangxx', 'llvm-openmp', 'lld', 'gcc'];
  let compilerPrefix = await getCondaPrefix(COMPILER_ENV, false);

  // Prepare MSVC environment
  await runVcvars64();

  // Remove any bad linkers from PATH to avoid conflicts
  removeBadLinkersFromPath();

  // Install required compilers and tools via Conda
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install Conda Packages');
  try {
    const condaCommand = compilerPrefix ? 'install' : 'create';
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', [
      condaCommand,
      ...(condaCommand === 'create' ? ['--no-default-packages'] : []),
      '--yes',
      '--name',
      COMPILER_ENV,
      ...packages,
      '-c',
      'conda-forge'
    ]);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Conda packages installed in ${COMPILER_ENV}`);
  } catch (err) {
    throw new Error(`Conda compiler environment setup failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Conda environment information
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Show Conda Environment');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['info']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['list', '--name', TOOLS_ENV]);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['list', '--name', COMPILER_ENV]);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Add the private compiler paths to PATH so compiler commands remain unchanged
  compilerPrefix ||= await getCondaPrefix(COMPILER_ENV);
  const toolsPrefix = await getCondaPrefix(TOOLS_ENV);
  const variantBinPath = ['ucrt64', 'clang64', 'mingw64', 'clangarm64']
    .map(variant => (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', variant, 'bin'))
    .find(p => (0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p));

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Compiler Paths');
  // Expose compiler-specific paths only; keep Python and Scripts from the active tools environment.
  // addPath prepends each entry, so add them in reverse order.
  const paths = [
    variantBinPath,
    (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'mingw-w64', 'bin'),
    (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'usr', 'bin'),
    (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'bin'),
    (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'bin')
  ].filter(p => p && (0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)).reverse();
  for (const p of paths) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(p);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${p}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Verify that the compilers are installed and working
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Verify Compiler Commands');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', ['lfortran']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('lfortran', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', ['clang']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('where', ['clang++']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang++', ['--version']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Export compiler-related environment variables
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    FC: 'lfortran',
    CC: 'clang',
    CXX: 'clang++',
    FPM_FC: 'lfortran',
    FPM_CC: 'clang',
    FPM_CXX: 'clang++',
    CMAKE_Fortran_COMPILER: 'lfortran',
    CMAKE_C_COMPILER: 'clang',
    CMAKE_CXX_COMPILER: 'clang++',
    INCLUDE: [
      (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(toolsPrefix, 'Library', 'include'),
      (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(compilerPrefix, 'Library', 'include'),
      process.env.INCLUDE || ''
    ].filter(Boolean).join(';'),
    LFORTRAN_LINKER: 'gcc',
    CMAKE_AR: 'llvm-ar',
    CMAKE_RANLIB: 'llvm-ranlib',
    CMAKE_LINKER: 'lld'
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

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

  // Final success message
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
