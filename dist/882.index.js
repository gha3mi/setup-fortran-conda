export const id = 882;
export const ids = [882,244,640,917];
export const modules = {

/***/ 5882:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1455);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6760);
/* harmony import */ var _lib_checksum_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(3379);
/* harmony import */ var _lib_environment_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3775);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(7507);
/* harmony import */ var _aocc_environment_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(244);
/* harmony import */ var _aocc_release_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(7640);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(917);













function resolveAoccRoot(version) {
  const expectedRoot = `/opt/AMD/aocc-compiler-${version}`;
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(expectedRoot)) {
    return expectedRoot;
  }

  const installationDirectory = '/opt/AMD';
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(installationDirectory)) {
    const matchingDirectories = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(installationDirectory)
      .filter(
        (name) =>
          name === `aocc-compiler-${version}` ||
          name.startsWith('aocc-compiler-'),
      )
      .sort();
    const matchingDirectory =
      matchingDirectories.find((name) => name === `aocc-compiler-${version}`) ||
      matchingDirectories.at(-1);
    if (matchingDirectory) {
      return (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(installationDirectory, matchingDirectory);
    }
  }

  throw new Error(`Unable to locate AOCC installation under ${expectedRoot}.`);
}

async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .assertLinux */ .b4)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .installAptPackages */ .wS)(
    [
      'ca-certificates',
      'curl',
      'libstdc++6',
      'libncurses-dev',
      'zlib1g',
      'libxml2',
      'libquadmath0',
      'python3',
    ],
    {
      groupName: 'setup-fortran-conda: Install AOCC System Dependencies',
      errorMessage: 'AOCC system dependency installation failed',
    },
  );

  const release = await (0,_aocc_release_js__WEBPACK_IMPORTED_MODULE_9__/* .resolveAoccRelease */ .o)(version);
  const resolvedVersion = release.version;
  const packagePath = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(
    (0,node_os__WEBPACK_IMPORTED_MODULE_4__.tmpdir)(),
    `aocc-compiler-${resolvedVersion}_1_amd64.deb`,
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Download AOCC Debian Package',
    async () => {
      try {
        await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .downloadFile */ .PE)(release.url, packagePath, {
          connectTimeout: 30,
          http1: true,
          retryCount: 3,
          retryDelay: 2,
        });
        await (0,_lib_checksum_js__WEBPACK_IMPORTED_MODULE_6__/* .verifySha256 */ .n)({
          file: packagePath,
          product: 'AOCC',
          version: resolvedVersion,
          expected: release.checksum,
        });
      } catch (error) {
        throw new Error(`AOCC download failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_11__/* .getErrorMessage */ .u)(error)}`, {
          cause: error,
        });
      }
    },
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Install AOCC Debian Package',
    async () => {
      try {
        const exitCode = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['dpkg', '-i', packagePath], {
          ignoreReturnCode: true,
        });
        if (exitCode !== 0) {
          await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-f', '-y']);
        }
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('AOCC Debian package installed');
      } catch (error) {
        throw new Error(`AOCC install failed: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_11__/* .getErrorMessage */ .u)(error)}`, {
          cause: error,
        });
      } finally {
        await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_3__.rm)(packagePath, { force: true });
      }
    },
  );

  const condaPrefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .getCondaPrefix */ .s6)(_common_js__WEBPACK_IMPORTED_MODULE_10__/* .TOOLS_ENVIRONMENT_NAME */ .uU);
  const aoccRoot = resolveAoccRoot(resolvedVersion);
  const libraryDirectory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aoccRoot, 'lib');
  const library32Directory = (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(aoccRoot, 'lib32');
  const {
    binDirectory,
    wrapperDirectory,
    variables: aoccEnvironment,
  } = await (0,_aocc_environment_js__WEBPACK_IMPORTED_MODULE_8__/* .prepareAoccEnvironment */ .L)(aoccRoot);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .addExistingPaths */ .Bf)([
    (0,node_path__WEBPACK_IMPORTED_MODULE_5__.join)(condaPrefix, 'bin'),
    binDirectory,
    wrapperDirectory,
  ]);

  const ldLibraryPath = (0,_lib_environment_js__WEBPACK_IMPORTED_MODULE_7__/* .prependPathEntries */ .U)(
    [libraryDirectory, library32Directory].filter((candidate) =>
      (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(candidate),
    ),
    aoccEnvironment.LD_LIBRARY_PATH || process.env.LD_LIBRARY_PATH,
  );
  const additionalEnvironment = Object.fromEntries(
    Object.entries(aoccEnvironment).filter(
      ([key]) => key !== 'PATH' && key !== 'LD_LIBRARY_PATH',
    ),
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .verifyCommands */ .I6)([
    { command: 'amdflang', args: ['--version'] },
    { command: 'amdclang', args: ['-v'] },
    { command: 'amdclang++', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .createCompilerEnvironment */ .Tp)('amdflang', 'amdclang', 'amdclang++', {
      ...additionalEnvironment,
      AOCC_HOME: aoccRoot,
      AOCC_ROOT: aoccRoot,
      LD_LIBRARY_PATH: ldLibraryPath,
    }),
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .configureLinuxUlimits */ .O7)();

  (0,_common_js__WEBPACK_IMPORTED_MODULE_10__/* .logCompilerSetupComplete */ .Ys)();
}


/***/ }),

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


/***/ }),

/***/ 7640:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   o: () => (/* binding */ resolveAoccRelease)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7507);
/* harmony import */ var _lib_http_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5312);
/* harmony import */ var _lib_version_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1018);





const AOCC_DOWNLOAD_PAGE = 'https://www.amd.com/en/developer/aocc.html';

function normalizeAoccVersion(version = '') {
  const normalizedInput = version.trim().toLowerCase();
  if (!normalizedInput || normalizedInput === 'latest') {
    return 'latest';
  }

  const versionWithoutPrefix = normalizedInput
    .replace(/^v/, '')
    .replace(/^aocc-compiler-/, '')
    .replace(/_1_amd64\.deb$/, '');
  const normalizedVersion = /^\d+\.\d+$/.test(versionWithoutPrefix)
    ? `${versionWithoutPrefix}.0`
    : versionWithoutPrefix;

  if (!/^\d+\.\d+\.\d+$/.test(normalizedVersion)) {
    throw new Error(
      'AOCC compiler-version must be "latest", major.minor, or ' +
        `major.minor.patch; got "${version}".`,
    );
  }

  return normalizedVersion;
}

function createAoccDebUrl(version) {
  const [majorVersion, minorVersion] = version.split('.');
  return (
    'https://download.amd.com/developer/eula/aocc/' +
    `aocc-${majorVersion}-${minorVersion}/` +
    `aocc-compiler-${version}_1_amd64.deb`
  );
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function resolveDownloadUrl(href, filename) {
  if (!href) {
    return '';
  }

  let url;
  try {
    url = new URL(decodeHtml(href), AOCC_DOWNLOAD_PAGE);
  } catch {
    return '';
  }

  if (url.hostname !== 'download.amd.com') {
    return '';
  }
  if (!url.pathname.endsWith(filename)) {
    return '';
  }
  return url.toString();
}

function fetchAoccDownloadPage() {
  return (0,_lib_http_js__WEBPACK_IMPORTED_MODULE_1__/* .requestTextWithRetries */ .d)(AOCC_DOWNLOAD_PAGE, {
    attempts: 3,
    headers: {
      'User-Agent': 'setup-fortran-conda',
      Accept: 'text/html,application/xhtml+xml',
    },
    onRetry(error) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
        `AOCC download page fetch failed ` +
          `(${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_2__/* .getErrorMessage */ .u)(error)}); retrying.`,
      );
    },
    retryDelay: 2_000,
  });
}

function parseAoccDebReleases(html) {
  const releases = new Map();
  const filenameRegex = /aocc-compiler-(\d+\.\d+\.\d+)_1_amd64\.deb/g;
  let match;

  while ((match = filenameRegex.exec(html)) !== null) {
    const version = match[1];
    const filename = match[0];
    const contextStart = Math.max(0, match.index - 1000);
    const contextEnd = Math.min(
      html.length,
      match.index + filename.length + 2500,
    );
    const context = html.slice(contextStart, contextEnd);
    const contentAfterFilename = html.slice(
      match.index + filename.length,
      contextEnd,
    );

    const directUrl = context.match(
      new RegExp(
        `https://download\\.amd\\.com[^"'\\s<>]*${escapeRegularExpression(
          filename,
        )}`,
        'i',
      ),
    );
    const href = context.match(
      new RegExp(
        `href=["']([^"']*${escapeRegularExpression(filename)}[^"']*)["']`,
        'i',
      ),
    );
    const hrefUrl = resolveDownloadUrl(href?.[1], filename);
    let url = createAoccDebUrl(version);
    if (directUrl) {
      url = decodeHtml(directUrl[0]);
    } else if (hrefUrl) {
      url = hrefUrl;
    }

    const checksum = (
      contentAfterFilename.match(/\b[a-fA-F0-9]{64}\b/)?.[0] || ''
    ).toLowerCase();
    releases.set(version, { version, url, checksum });
  }

  return Array.from(releases.values()).sort((left, right) =>
    (0,_lib_version_js__WEBPACK_IMPORTED_MODULE_3__/* .compareNumericVersions */ .UA)(right.version, left.version),
  );
}

async function resolveAoccRelease(requestedVersion = '') {
  const normalizedVersion = normalizeAoccVersion(requestedVersion);

  if (normalizedVersion === 'latest') {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const latestRelease = releases[0];
    if (!latestRelease) {
      throw new Error(
        `Unable to resolve latest AOCC Debian package from ${AOCC_DOWNLOAD_PAGE}.`,
      );
    }
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest AOCC version: ${latestRelease.version}`);
    return latestRelease;
  }

  try {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const matchingRelease = releases.find(
      (candidate) => candidate.version === normalizedVersion,
    );
    if (matchingRelease) {
      return matchingRelease;
    }
  } catch (error) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
      `Unable to read AOCC download page for checksum discovery: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_2__/* .getErrorMessage */ .u)(
        error,
      )}`,
    );
  }

  return {
    version: normalizedVersion,
    url: createAoccDebUrl(normalizedVersion),
    checksum: '',
  };
}


/***/ }),

/***/ 917:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bf: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Bf),
/* harmony export */   I6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.I6),
/* harmony export */   MA: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.MA),
/* harmony export */   O7: () => (/* binding */ configureLinuxUlimits),
/* harmony export */   PE: () => (/* binding */ downloadFile),
/* harmony export */   Qv: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Qv),
/* harmony export */   Se: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Se),
/* harmony export */   Tp: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Tp),
/* harmony export */   U_: () => (/* binding */ fetchTextWithCurl),
/* harmony export */   Up: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Up),
/* harmony export */   Ys: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.Ys),
/* harmony export */   b4: () => (/* binding */ assertLinux),
/* harmony export */   s6: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.s6),
/* harmony export */   uU: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.uU),
/* harmony export */   wS: () => (/* binding */ installAptPackages),
/* harmony export */   x7: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.x7),
/* harmony export */   zk: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_6__.zk)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);
/* harmony import */ var _lib_command_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7819);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(7507);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9674);











function assertLinux(
  message = 'This setup script is only supported on Linux.',
) {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .assertPlatform */ .G6)('linux', message);
}

async function configureLinuxUlimits() {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)(
    'setup-fortran-conda: Configure Linux Environment',
    async () => {
      const command =
        'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
      const script = (0,node_path__WEBPACK_IMPORTED_MODULE_4__.join)(process.env.RUNNER_TEMP, 'ulimit.sh');
      (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(script, `${command}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
      (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .exportEnvironmentVariable */ .qY)('BASH_ENV', script);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
    },
  );
}

async function installAptPackages(
  packages,
  {
    groupName = 'setup-fortran-conda: Install System Packages',
    errorMessage = 'System package installation failed',
  } = {},
) {
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_6__/* .runInGroup */ .Se)(groupName, async () => {
    try {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-y', ...packages]);
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_7__/* .getErrorMessage */ .u)(error)}`, {
        cause: error,
      });
    }
  });
}

async function downloadFile(
  url,
  destination,
  {
    connectTimeout,
    continueAt,
    http1 = false,
    retryCount = 3,
    retryDelay,
    silent = false,
  } = {},
) {
  const args = [
    ...(http1 ? ['--http1.1'] : []),
    '--fail',
    '--location',
    ...(silent ? ['--silent', '--show-error'] : []),
    ...(connectTimeout ? ['--connect-timeout', String(connectTimeout)] : []),
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    ...(retryDelay ? ['--retry-delay', String(retryDelay)] : []),
    ...(continueAt ? ['--continue-at', continueAt] : []),
    '--output',
    destination,
    url,
  ];

  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('curl', args);
}

async function fetchTextWithCurl(
  url,
  { retryCount = 3, userAgent = 'setup-fortran-conda' } = {},
) {
  const result = await (0,_lib_command_js__WEBPACK_IMPORTED_MODULE_5__/* .captureCommand */ .g)('curl', [
    '--fail',
    '--location',
    '--silent',
    '--show-error',
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    '--user-agent',
    userAgent,
    url,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to fetch ${url}: ${result.stderr || result.stdout}`,
    );
  }

  return result.stdout;
}


/***/ }),

/***/ 3379:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ verifySha256)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7598);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);




function calculateSha256(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,node_crypto__WEBPACK_IMPORTED_MODULE_1__.createHash)('sha256');
    const stream = (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.createReadStream)(file);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifySha256({ file, product, version, expected }) {
  if (!expected) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
      `No ${product} checksum is known for ${version}; ` +
        'skipping checksum verification.',
    );
    return;
  }

  const actual = await calculateSha256(file);
  if (actual !== expected) {
    throw new Error(
      `${product} ${version} checksum mismatch: ` +
        `expected ${expected}, got ${actual}`,
    );
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Verified ${product} ${version} SHA-256 checksum`);
}


/***/ })

};
