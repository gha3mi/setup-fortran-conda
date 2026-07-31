export const id = 564;
export const ids = [564];
export const modules = {

/***/ 5564:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Bf),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Qv),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Se),
/* harmony export */   Tp: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Tp),
/* harmony export */   WQ: () => (/* binding */ configureMacOsSdkRoot),
/* harmony export */   Ys: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Ys),
/* harmony export */   eI: () => (/* binding */ assertMacOs),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.x7),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.zk)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _lib_command_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7819);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9674);






function assertMacOs() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertPlatform */ .G6)('darwin', 'This setup script is only supported on macOS.');
}

async function configureMacOsSdkRoot() {
  const result = await (0,_lib_command_js__WEBPACK_IMPORTED_MODULE_1__/* .captureCommand */ .g)('xcrun', [
    '--sdk',
    'macosx',
    '--show-sdk-path',
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`Unable to detect macOS SDK path: ${result.stderr}`);
  }

  const sdkPath = result.stdout.trim();
  if (sdkPath) {
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportEnvironmentVariable */ .qY)('SDKROOT', sdkPath);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('macOS SDK path was empty; SDKROOT was not exported');
  }
}


/***/ })

};
