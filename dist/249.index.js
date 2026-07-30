export const id = 249;
export const ids = [249,994];
export const modules = {

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
    (0,_common_js__WEBPACK_IMPORTED_MODULE_4__/* .exportEnv */ .EE)('BASH_ENV', script);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
  });
}


/***/ }),

/***/ 249:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1455);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);
/* harmony import */ var node_process__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(1708);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(994);








const NVHPC_APT_ROOT =
  'https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64';

// Free up disk space
async function freeUpDiskSpace() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .grouped */ .zD)('setup-fortran-conda: Free Disk Space', async () => {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
      'rm',
      '-rf',
      '/usr/local/lib/android',
      '/usr/local/android-sdk',
      '/usr/share/dotnet',
    ]);
  });
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

async function getNVHPCPackage(version) {
  if (!/^\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid NVIDIA HPC SDK version "${version}". Expected MAJOR.MINOR.`);
  }

  const packageId = `nvhpc-${version.replace(/\./g, '-')}`;
  let packageIndex = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(
    'curl',
    [
      '--fail',
      '--location',
      '--silent',
      '--show-error',
      '--retry',
      '5',
      '--retry-all-errors',
      `${NVHPC_APT_ROOT}/Packages`,
    ],
    {
      silent: true,
      listeners: { stdout: data => (packageIndex += data.toString()) },
    }
  );

  const stanza = packageIndex
    .split(/\r?\n\r?\n/)
    .find(entry => entry.split(/\r?\n/).includes(`Package: ${packageId}`));
  const filenameLine = stanza
    ?.split(/\r?\n/)
    .find(line => line.startsWith('Filename:'));
  const packageName = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.basename)(filenameLine?.slice('Filename:'.length).trim() || '');

  if (!packageName.endsWith('.deb')) {
    throw new Error(`NVIDIA package index does not contain ${packageId}.`);
  }

  return {
    path: (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_3__.tmpdir)(), packageName),
    url: `${NVHPC_APT_ROOT}/${packageName}`,
  };
}

// Main setup function
async function setup(version) {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .assertLinux */ .b4)();

  await freeUpDiskSpace();

  version = version?.trim() || await getLatestNVHPC();

  // Download the package directly because NVIDIA's APT index currently uses
  // a "./" filename that its CDN does not serve.
  let nvhpcPackage;
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .grouped */ .zD)('setup-fortran-conda: Install NVIDIA HPC SDK', async () => {
    try {
      nvhpcPackage = await getNVHPCPackage(version);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('curl', [
        '--fail',
        '--location',
        '--silent',
        '--show-error',
        '--retry',
        '5',
        '--retry-all-errors',
        '--continue-at',
        '-',
        '--output',
        nvhpcPackage.path,
        nvhpcPackage.url,
      ]);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-y', nvhpcPackage.path]);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('NVIDIA HPC SDK installed');
    } catch (error) {
      throw new Error(`NVIDIA HPC SDK install failed: ${error.message}`);
    } finally {
      try {
        if (nvhpcPackage) await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_2__.rm)(nvhpcPackage.path, { force: true });
      } catch (error) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Unable to remove NVIDIA installer: ${error.message}`);
      }
    }
  });

  const base = '/opt/nvidia/hpc_sdk';
  const arch = 'Linux_x86_64';
  const binComp = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(base, arch, version, 'compilers', 'bin');
  const binMPI = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(base, arch, version, 'comm_libs', 'mpi', 'bin');
  const libComp = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(base, arch, version, 'compilers', 'lib');
  const libMPI = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(base, arch, version, 'comm_libs', 'mpi', 'lib');

  // Conda path
  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .getCondaPrefix */ .s6)('fortran');
  const condaBin = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(prefix, 'bin');

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .addExistingPaths */ .Bf)([binComp, binMPI, condaBin]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .verifyCommands */ .I6)([
    { command: 'nvfortran', args: ['--version'] },
    { command: 'nvc', args: ['--version'] },
    { command: 'nvc++', args: ['--version'] },
  ]);

  // Export compiler-related environment variables
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .compilerEnvironment */ .HD)('nvfortran', 'nvc', 'nvc++', {
      LD_LIBRARY_PATH: [libComp, libMPI, node_process__WEBPACK_IMPORTED_MODULE_5__.env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
      NVHPC: base,
    })
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .setLinuxUlimits */ .QK)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ })

};
