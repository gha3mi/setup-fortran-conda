export const id = 409;
export const ids = [409];
export const modules = {

/***/ 409:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installExtras: () => (/* binding */ installExtras)
/* harmony export */ });
/* unused harmony export createExtraPackageSpecs */
/* harmony import */ var _compilers_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9674);
/* harmony import */ var _blas_support_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8110);



function createExtraPackageSpecs(
  extraPackages = [],
  fpmVersion = '',
  blas = 'none',
) {
  const normalizedFpmVersion = String(fpmVersion || '')
    .trim()
    .toLowerCase();
  const requestedFpmVersion =
    normalizedFpmVersion === 'latest' ? '' : normalizedFpmVersion;
  const blasPackageSpec = (0,_blas_support_js__WEBPACK_IMPORTED_MODULE_1__/* .createBlasPackageSpec */ .WV)(blas);
  const normalizedExtraPackages = extraPackages
    .map((packageName) => packageName.trim())
    .filter(Boolean);

  return [
    (0,_compilers_common_js__WEBPACK_IMPORTED_MODULE_0__/* .createCondaPackageSpec */ .zk)('fpm', requestedFpmVersion),
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    ...(blasPackageSpec ? [blasPackageSpec] : []),
    ...normalizedExtraPackages,
  ];
}

async function installExtras(
  environmentName = _compilers_common_js__WEBPACK_IMPORTED_MODULE_0__/* .TOOLS_ENVIRONMENT_NAME */ .uU,
  extraPackages = [],
  fpmVersion = '',
  blas = 'none',
) {
  const packages = createExtraPackageSpecs(extraPackages, fpmVersion, blas);

  await (0,_compilers_common_js__WEBPACK_IMPORTED_MODULE_0__/* .installCondaPackages */ .MA)(packages, {
    environmentName,
    successMessage: 'Extra packages installed',
    errorMessage: 'Extra package installation failed',
  });
}


/***/ })

};
