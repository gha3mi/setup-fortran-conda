export const id = 841;
export const ids = [841];
export const modules = {

/***/ 5841:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installExtras: () => (/* binding */ installExtras)
/* harmony export */ });
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2876);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3360);



async function installExtras(env = 'fortran', extras = [], fpmVersion = '') {
  const v = (fpmVersion || '').trim().toLowerCase();
  const fpmPkg = (!v || v === 'latest') ? 'fpm' : `fpm=${v}`;
  const pkgs = [fpmPkg,'pkg-config', 'cmake', 'ninja', 'meson', ...extras.map(p => p.trim()).filter(Boolean)];
  if (!pkgs.length) return;

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__/* .startGroup */ .Oh)('setup-fortran-conda: Install Extra Packages');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_0__/* .exec */ .m)('conda', [
    'install',
    '--yes',
    '--name',
    env,
    '-c',
    'conda-forge',
    ...pkgs
  ]);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_1__/* .endGroup */ .N4)();
}

/***/ })

};
