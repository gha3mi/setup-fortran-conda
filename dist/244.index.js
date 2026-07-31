export const id = 244;
export const ids = [244];
export const modules = {

/***/ 244:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   L: () => (/* binding */ prepareAoccEnvironment)
/* harmony export */ });
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6760);





const AOCC_SHELL_ENVIRONMENT = Object.freeze([
  'PATH',
  'LD_LIBRARY_PATH',
  'LIBRARY_PATH',
  'COMPILER_PATH',
  'CPATH',
  'C_INCLUDE_PATH',
  'CPLUS_INCLUDE_PATH',
]);

async function loadAoccEnvironment(environmentScriptPath) {
  let output = '';
  const command = [
    'set -e',
    'source "$1" >/dev/null',
    `for name in ${AOCC_SHELL_ENVIRONMENT.join(' ')}; do`,
    '  if [[ -v $name ]]; then',
    '    printf \'%s=%s\\0\' "$name" "${!name}"',
    '  fi',
    'done',
  ].join('\n');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_0__/* .exec */ .m)(
    'bash',
    ['-c', command, 'setup-fortran-conda', environmentScriptPath],
    {
      silent: true,
      listeners: {
        stdout: (data) => {
          output += data.toString();
        },
      },
    },
  );

  const environment = {};
  for (const pair of output.split('\0')) {
    if (!pair) {
      continue;
    }
    const separator = pair.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = pair.slice(0, separator);
    if (!AOCC_SHELL_ENVIRONMENT.includes(key)) {
      continue;
    }
    const value = pair.slice(separator + 1);
    process.env[key] = value;
    environment[key] = value;
  }
  return environment;
}

function quoteBashArgument(value) {
  const escaped = String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('$', '\\$')
    .replaceAll('`', '\\`');
  return `"${escaped}"`;
}

function writeWrapper(wrapperDirectory, name, executablePath) {
  const wrapperPath = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(wrapperDirectory, name);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.writeFileSync)(
    wrapperPath,
    `#!/usr/bin/env bash\nexec ${quoteBashArgument(executablePath)} "$@"\n`,
  );
  (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.chmodSync)(wrapperPath, 0o755);
}

function writeAmdflangWrapper(wrapperDirectory, compilerPath) {
  const wrapperPath = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(wrapperDirectory, 'amdflang');
  (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.writeFileSync)(
    wrapperPath,
    `#!/usr/bin/env bash
args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -fimplicit-none)
      shift
      ;;
    -module-dir)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: -module-dir requires an argument" >&2
        exit 1
      fi
      args+=("-module" "$2")
      shift 2
      ;;
    -module-dir=*)
      args+=("-module" "\${1#-module-dir=}")
      shift
      ;;
    -J)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: -J requires an argument" >&2
        exit 1
      fi
      args+=("-module" "$2")
      shift 2
      ;;
    -J*)
      args+=("-module" "\${1#-J}")
      shift
      ;;
    -MD)
      shift
      ;;
    -MQ|-MF)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: $1 requires an argument" >&2
        exit 1
      fi
      shift 2
      ;;
    -MQ*|-MF*)
      shift
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

exec ${quoteBashArgument(compilerPath)} "\${args[@]}"
`,
  );
  (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.chmodSync)(wrapperPath, 0o755);
}

function createAoccWrappers(binDirectory) {
  const wrapperDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(
    process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_2__.tmpdir)(),
    'setup-fortran-conda-aocc-bin',
  );
  (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.mkdirSync)(wrapperDirectory, { recursive: true });

  const amdflangPath = (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'amdflang'))
    ? (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'amdflang')
    : (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'flang');
  writeAmdflangWrapper(wrapperDirectory, amdflangPath);

  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'amdclang'))) {
    writeWrapper(wrapperDirectory, 'amdclang', (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'clang'));
  }
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'amdclang++'))) {
    writeWrapper(wrapperDirectory, 'amdclang++', (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(binDirectory, 'clang++'));
  }

  return wrapperDirectory;
}

async function prepareAoccEnvironment(aoccRoot) {
  const environmentScriptPath = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(aoccRoot, 'setenv_AOCC.sh');
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_1__.existsSync)(environmentScriptPath)) {
    throw new Error(
      `Unable to locate AOCC environment script: ${environmentScriptPath}`,
    );
  }

  const binDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_3__.join)(aoccRoot, 'bin');
  return {
    binDirectory,
    wrapperDirectory: createAoccWrappers(binDirectory),
    variables: await loadAoccEnvironment(environmentScriptPath),
  };
}


/***/ })

};
