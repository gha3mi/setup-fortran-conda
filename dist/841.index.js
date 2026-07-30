export const id = 841;
export const ids = [841];
export const modules = {

/***/ 5841:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installExtras: () => (/* binding */ installExtras)
/* harmony export */ });
/* harmony import */ var _platform_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7174);


async function installExtras(env = 'fortran', extras = [], fpmVersion = '') {
  const v = (fpmVersion || '').trim().toLowerCase();
  const fpmPkg = !v || v === 'latest' ? 'fpm' : `fpm=${v}`;
  const packages = [
    fpmPkg,
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    ...extras.map((packageName) => packageName.trim()).filter(Boolean),
  ];
  if (!packages.length) return;

  await (0,_platform_common_js__WEBPACK_IMPORTED_MODULE_0__/* .installCondaPackages */ .MA)(packages, {
    envName: env,
    successMessage: 'Extra packages installed',
    errorMessage: 'Extra package installation failed',
  });
}


/***/ })

};
