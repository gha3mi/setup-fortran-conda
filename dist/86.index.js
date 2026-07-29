export const id = 86;
export const ids = [86];
export const modules = {

/***/ 8086:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7264);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6928);
/* harmony import */ var os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(857);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9896);







async function getCondaPrefix(envName) {
    let raw = '';
    await _exec('conda', ['env', 'list', '--json'], {
        silent: true,
        listeners: { stdout: (d) => (raw += d.toString()) },
    });
    const { envs } = JSON.parse(raw);
    for (const p of envs) {
        if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
    }
    throw new Error(`Unable to locate Conda environment "${envName}".`);
}

async function exportActivatedCondaEnv(envName) {
    const scriptPath = path__WEBPACK_IMPORTED_MODULE_2__.join(os__WEBPACK_IMPORTED_MODULE_3__.tmpdir(), 'export-conda-env.sh');

    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Conda Environment');
    fs__WEBPACK_IMPORTED_MODULE_4__.writeFileSync(scriptPath, `#!/usr/bin/env bash
set -eo pipefail

source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate ${envName}

printenv | while IFS="=" read -r line; do
  key="\${line%%=*}"
  value="\${line#*=}"
  [ -z "\$key" ] && continue
  # Properly escape values with special characters
  printf '%s=%q\n' "\$key" "\$value" >> "\$GITHUB_ENV"
done
`);

    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Script: ${scriptPath}`);

    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('bash', [scriptPath]);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

async function setup(version = '') {
    const packageList = version
        ? [`gfortran=${version}`, 'mpich']
        : ['gfortran', 'mpich'];

    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install Conda Packages');
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', [
        'install',
        '--yes',
        '--name',
        'fortran',
        '-c',
        'conda-forge',
        ...packageList,
    ]);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

    await exportActivatedCondaEnv('fortran');
}


/***/ })

};
