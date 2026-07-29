export const id = 249;
export const ids = [249];
export const modules = {

/***/ 249:
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
    listeners: { stdout: d => (raw += d.toString()) }
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

// Free up disk space
async function freeUpDiskSpace() {
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Free Disk Space');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['rm', '-rf', '/usr/local/lib/android', '/usr/local/android-sdk', '/usr/share/dotnet']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

async function getLatestNVHPC() {
  let out = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('bash', [
    '-c',
    "curl -Ls https://developer.nvidia.com/hpc-sdk-downloads | grep -oE 'hpc-sdk/[0-9]+\\.[0-9]+' | cut -d/ -f2 | sort -V | tail -1"
  ], {
    silent: true,
    listeners: { stdout: d => (out += d.toString()) }
  });

  return out.trim();
}

// Main setup function
async function setup(version) {
  if (process__WEBPACK_IMPORTED_MODULE_5__.platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  await freeUpDiskSpace();

  version = version?.trim() || await getLatestNVHPC();

  // Install NVIDIA HPC SDK via apt
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install NVIDIA HPC SDK');
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
      'bash', '-c',
      'curl -fsSL https://developer.download.nvidia.com/hpc-sdk/ubuntu/DEB-GPG-KEY-NVIDIA-HPC-SDK | gpg --dearmor -o /usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg'
    ]);
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
      'bash', '-c',
      `echo 'deb [signed-by=/usr/share/keyrings/nvidia-hpcsdk-archive-keyring.gpg] https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64 /' > /etc/apt/sources.list.d/nvhpc.list`
    ]);
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-y', `nvhpc-${version.replace(/\./g, '-')}`]);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('NVIDIA HPC SDK installed');
  } catch (err) {
    throw new Error(`NVIDIA HPC SDK install failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  const base = '/opt/nvidia/hpc_sdk';
  const arch = 'Linux_x86_64';
  const binComp = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(base, arch, version, 'compilers', 'bin');
  const binMPI = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(base, arch, version, 'comm_libs', 'mpi', 'bin');
  const libComp = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(base, arch, version, 'compilers', 'lib');
  const libMPI = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(base, arch, version, 'comm_libs', 'mpi', 'lib');

  // Conda path
  const prefix = await getCondaPrefix('fortran');
  const condaBin = (0,path__WEBPACK_IMPORTED_MODULE_2__.join)(prefix, 'bin');

  // Add all relevant bin directories to PATH
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Compiler Paths');
  const paths = [binComp, binMPI, condaBin];
  for (const p of paths) {
    if ((0,fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(p);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${p}`);
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Verify that the compilers are installed and working
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Verify Compiler Commands');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['nvfortran']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('nvfortran', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['nvc']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('nvc', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['nvc++']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('nvc++', ['--version']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  // Export compiler-related environment variables
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    FC: 'nvfortran',
    CC: 'nvc',
    CXX: 'nvc++',
    FPM_FC: 'nvfortran',
    FPM_CC: 'nvc',
    FPM_CXX: 'nvc++',
    CMAKE_Fortran_COMPILER: 'nvfortran',
    CMAKE_C_COMPILER: 'nvc',
    CMAKE_CXX_COMPILER: 'nvc++',
    LD_LIBRARY_PATH: [libComp, libMPI, process__WEBPACK_IMPORTED_MODULE_5__.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':'),
    NVHPC: base
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  setLinuxUlimits();

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
