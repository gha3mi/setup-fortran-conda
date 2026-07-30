export const id = 410;
export const ids = [410];
export const modules = {

/***/ 410:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Bf),
/* harmony export */   HD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.HD),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.MA),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.Qv),
/* harmony export */   eI: () => (/* binding */ assertMacOs),
/* harmony export */   gT: () => (/* binding */ setMacOsSdkRoot),
/* harmony export */   pI: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.pI),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.s6),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.x7),
/* harmony export */   zD: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_2__.zD)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7174);






function assertMacOs() {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .assertPlatform */ .G6)('darwin', 'This setup script is only supported on macOS.');
}

async function setMacOsSdkRoot() {
  let sdkPath = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        sdkPath += data.toString();
      },
    },
  });

  sdkPath = sdkPath.trim();
  if (sdkPath) {
    (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .exportEnv */ .EE)('SDKROOT', sdkPath);
  } else {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('⚠️ Failed to detect macOS SDK path.');
  }
}


/***/ })

};
