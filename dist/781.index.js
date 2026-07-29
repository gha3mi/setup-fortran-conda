export const id = 781;
export const ids = [781,994];
export const modules = {

/***/ 7174:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Aq: () => (/* binding */ TOOLS_ENVIRONMENT),
/* harmony export */   Bf: () => (/* binding */ addExistingPaths),
/* harmony export */   EE: () => (/* binding */ exportEnv),
/* harmony export */   G6: () => (/* binding */ assertPlatform),
/* harmony export */   HD: () => (/* binding */ compilerEnvironment),
/* harmony export */   I6: () => (/* binding */ verifyCommands),
/* harmony export */   MA: () => (/* binding */ installCondaPackages),
/* harmony export */   Qv: () => (/* binding */ showCondaEnvironment),
/* harmony export */   pI: () => (/* binding */ exportProcessEnvironment),
/* harmony export */   s6: () => (/* binding */ getCondaPrefix),
/* harmony export */   x7: () => (/* binding */ exportCompilerEnvironment),
/* harmony export */   zD: () => (/* binding */ grouped)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3024);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(6760);






const TOOLS_ENVIRONMENT = 'fortran';

function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

async function grouped(name, operation) {
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)(name);
  try {
    return await operation();
  } finally {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
  }
}

function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');

  const normalized = String(value);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(envFile, `${key}=${normalized}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
  process.env[key] = normalized;
}

function compilerEnvironment(fortran, c, cxx, extra = {}) {
  return {
    FC: fortran,
    CC: c,
    CXX: cxx,
    FPM_FC: fortran,
    FPM_CC: c,
    FPM_CXX: cxx,
    CMAKE_Fortran_COMPILER: fortran,
    CMAKE_C_COMPILER: c,
    CMAKE_CXX_COMPILER: cxx,
    ...extra,
  };
}

async function exportCompilerEnvironment(values) {
  await grouped('setup-fortran-conda: Export Compiler Environment', async () => {
    for (const [key, value] of Object.entries(values)) {
      exportEnv(key, value);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
    }
  });
}

async function exportProcessEnvironment({ warningPrefix = '⚠️ ' } = {}) {
  await grouped('setup-fortran-conda: Export Process Environment', async () => {
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value !== 'string') continue;

      try {
        process.env[key] = value;
        (0,node_fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(process.env.GITHUB_ENV, `${key}=${value}${node_os__WEBPACK_IMPORTED_MODULE_3__.EOL}`);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}`);
      } catch (error) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`${warningPrefix}Failed to export: ${key} (${error.message})`);
      }
    }
  });
}

async function getCondaPrefix(
  envName = TOOLS_ENVIRONMENT,
  required = true
) {
  let output = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
    },
  });

  const { envs = [] } = JSON.parse(output);
  const prefix = envs.find(
    (candidate) =>
      candidate.endsWith(node_path__WEBPACK_IMPORTED_MODULE_4__.sep + envName) || candidate.endsWith('/' + envName)
  );

  if (!prefix && required) {
    throw new Error(`Unable to locate Conda environment "${envName}".`);
  }
  return prefix || '';
}

async function installCondaPackages(
  packages,
  {
    envName = TOOLS_ENVIRONMENT,
    channels = ['conda-forge'],
    command = 'install',
    commandOptions = [],
    successMessage = 'Conda packages installed',
    errorMessage = 'Conda install failed',
  } = {}
) {
  await grouped('setup-fortran-conda: Install Conda Packages', async () => {
    try {
      const args = [
        command,
        ...commandOptions,
        '--yes',
        '--name',
        envName,
        ...packages,
      ];
      for (const channel of channels) args.push('-c', channel);

      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', args);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(successMessage);
    } catch (error) {
      throw new Error(`${errorMessage}: ${error.message}`);
    }
  });
}

async function showCondaEnvironment(envNames = [TOOLS_ENVIRONMENT]) {
  await grouped('setup-fortran-conda: Show Conda Environment', async () => {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['info']);
    for (const envName of envNames) {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['list', '--name', envName]);
    }
  });
}

async function addExistingPaths(paths, { log = true } = {}) {
  await grouped('setup-fortran-conda: Configure Compiler Paths', async () => {
    for (const path of paths) {
      if (!path || !(0,node_fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(path)) continue;

      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(path);
      if (log) (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${path}`);
    }
  });
}

async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await grouped('setup-fortran-conda: Verify Compiler Commands', async () => {
    for (const { command, args } of commands) {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(lookupCommand, [command]);
      if (args) await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)(command, args);
    }
  });
}


/***/ }),

/***/ 1781:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7598);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(3024);
/* harmony import */ var node_https__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(4708);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(8161);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(6760);
/* harmony import */ var node_process__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(1708);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(994);










const AOCC_DOWNLOAD_PAGE = 'https://www.amd.com/en/developer/aocc.html';

function normalizeVersion(version = '') {
  const v = version.trim().toLowerCase();
  if (!v || v === 'latest') return 'latest';

  const bare = v
    .replace(/^v/, '')
    .replace(/^aocc-compiler-/, '')
    .replace(/_1_amd64\.deb$/, '');
  const normalized = /^\d+\.\d+$/.test(bare) ? `${bare}.0` : bare;

  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    throw new Error(
      'AOCC compiler-version must be "latest", major.minor, or ' +
        `major.minor.patch; got "${version}".`
    );
  }

  return normalized;
}

function aoccDebUrl(version) {
  const [major, minor] = version.split('.');
  return (
    'https://download.amd.com/developer/eula/aocc/' +
    `aocc-${major}-${minor}/aocc-compiler-${version}_1_amd64.deb`
  );
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function compareVersions(a, b) {
  const av = a.split('.').map(Number);
  const bv = b.split('.').map(Number);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const diff = (av[i] || 0) - (bv[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function resolvedDownloadHref(href, filename) {
  if (!href) return '';

  let url;
  try {
    url = new URL(decodeHtml(href), AOCC_DOWNLOAD_PAGE);
  } catch {
    return '';
  }

  if (url.hostname !== 'download.amd.com') return '';
  if (!url.pathname.endsWith(filename)) return '';
  return url.toString();
}

function httpsGetText(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = node_https__WEBPACK_IMPORTED_MODULE_4__.get(
      url,
      {
        headers: {
          'User-Agent': 'setup-fortran-conda',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 60000,
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;

        if (status >= 300 && status < 400 && location && redirects > 0) {
          res.resume();
          resolve(httpsGetText(new URL(location, url).toString(), redirects - 1));
          return;
        }

        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`Failed to fetch ${url}: HTTP ${status}`));
          return;
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );

    req.on('timeout', () => req.destroy(new Error(`Timed out fetching ${url}`)));
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAoccDownloadPage() {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await httpsGetText(AOCC_DOWNLOAD_PAGE);
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(`AOCC download page fetch failed (${err.message}); retrying.`);
        await sleep(2000);
      }
    }
  }

  throw lastError;
}

function parseAoccDebReleases(html) {
  const releases = new Map();
  const filenameRegex = /aocc-compiler-(\d+\.\d+\.\d+)_1_amd64\.deb/g;
  let match;

  while ((match = filenameRegex.exec(html)) !== null) {
    const version = match[1];
    const filename = match[0];
    const start = Math.max(0, match.index - 1000);
    const end = Math.min(html.length, match.index + filename.length + 2500);
    const context = html.slice(start, end);
    const afterFilename = html.slice(match.index + filename.length, end);

    const directUrl = context.match(
      new RegExp(
        `https://download\\.amd\\.com[^"'\\s<>]*${escapeRegExp(filename)}`,
        'i'
      )
    );
    const href = context.match(
      new RegExp(
        `href=["']([^"']*${escapeRegExp(filename)}[^"']*)["']`,
        'i'
      )
    );
    const hrefUrl = resolvedDownloadHref(href?.[1], filename);
    const url = directUrl
      ? decodeHtml(directUrl[0])
      : hrefUrl
        ? hrefUrl
        : aoccDebUrl(version);

    const checksum = (afterFilename.match(/\b[a-fA-F0-9]{64}\b/)?.[0] || '').toLowerCase();
    releases.set(version, { version, url, checksum });
  }

  return Array.from(releases.values()).sort((a, b) => compareVersions(b.version, a.version));
}

async function resolveAoccRelease(requestedVersion = '') {
  const normalized = normalizeVersion(requestedVersion);

  if (normalized === 'latest') {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const latest = releases[0];
    if (!latest) {
      throw new Error(`Unable to resolve latest AOCC Debian package from ${AOCC_DOWNLOAD_PAGE}.`);
    }
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest AOCC version: ${latest.version}`);
    return latest;
  }

  try {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const release = releases.find(r => r.version === normalized);
    if (release) return release;
  } catch (err) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(`Unable to read AOCC download page for checksum discovery: ${err.message}`);
  }

  return {
    version: normalized,
    url: aoccDebUrl(normalized),
    checksum: ''
  };
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,node_crypto__WEBPACK_IMPORTED_MODULE_2__.createHash)('sha256');
    const stream = (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.createReadStream)(file);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyChecksum(file, version, expected) {
  if (!expected) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(`No AOCC checksum is known for ${version}; skipping checksum verification.`);
    return;
  }

  const actual = await sha256File(file);
  if (actual !== expected) {
    throw new Error(`AOCC ${version} checksum mismatch: expected ${expected}, got ${actual}`);
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Verified AOCC ${version} SHA-256 checksum`);
}

function resolveAoccRoot(version) {
  const root = `/opt/AMD/aocc-compiler-${version}`;
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(root)) return root;

  const base = '/opt/AMD';
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(base)) {
    const matches = (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.readdirSync)(base)
      .filter(name => name === `aocc-compiler-${version}` || name.startsWith('aocc-compiler-'))
      .sort();
    const found = matches.find(name => name === `aocc-compiler-${version}`) || matches.at(-1);
    if (found) return (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(base, found);
  }

  throw new Error(`Unable to locate AOCC installation under ${root}.`);
}

async function sourceAoccEnvironment(setenvPath) {
  let raw = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('bash', ['-c', `source "${setenvPath}" >/dev/null && env -0`], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });

  for (const pair of raw.split('\0')) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    node_process__WEBPACK_IMPORTED_MODULE_7__.env[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}

function prependPathList(paths, current = '') {
  const seen = new Set();
  return [...paths, ...current.split(':')]
    .filter(Boolean)
    .filter(p => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    })
    .join(':');
}

function writeWrapper(wrapperDir, name, command) {
  const wrapperPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(wrapperDir, name);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.writeFileSync)(wrapperPath, `#!/usr/bin/env bash\nexec ${command} "$@"\n`);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.chmodSync)(wrapperPath, 0o755);
}

function writeAmdflangWrapper(wrapperDir, compilerPath) {
  const wrapperPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(wrapperDir, 'amdflang');
  (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.writeFileSync)(wrapperPath, `#!/usr/bin/env bash
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
    *)
      args+=("$1")
      shift
      ;;
  esac
done

exec "${compilerPath}" "\${args[@]}"
`);
  (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.chmodSync)(wrapperPath, 0o755);
}

function createAoccWrappers(binPath) {
  const wrapperDir = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_5__.tmpdir)(), 'setup-fortran-conda-aocc-bin');
  (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync)(wrapperDir, { recursive: true });

  const amdflangPath = (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'amdflang'))
    ? (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'amdflang')
    : (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'flang');
  writeAmdflangWrapper(wrapperDir, amdflangPath);

  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'amdclang'))) {
    writeWrapper(wrapperDir, 'amdclang', `"${(0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'clang')}"`);
  }
  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'amdclang++'))) {
    writeWrapper(wrapperDir, 'amdclang++', `"${(0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(binPath, 'clang++')}"`);
  }

  return wrapperDir;
}

// Main setup function
async function setup(version = '') {
  (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .assertLinux */ .b4)();

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)(
    'setup-fortran-conda: Install AOCC System Dependencies',
    async () => {
      try {
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
          'apt-get',
          'install',
          '-y',
          'ca-certificates',
          'curl',
          'libstdc++6',
          'libncurses-dev',
          'zlib1g',
          'libxml2',
          'libquadmath0',
          'python3',
        ]);
      } catch (error) {
        throw new Error(
          `AOCC system dependency install failed: ${error.message}`
        );
      }
    }
  );

  const release = await resolveAoccRelease(version);
  version = release.version;
  const debPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)((0,node_os__WEBPACK_IMPORTED_MODULE_5__.tmpdir)(), `aocc-compiler-${version}_1_amd64.deb`);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)(
    'setup-fortran-conda: Download AOCC Debian Package',
    async () => {
      try {
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('curl', [
          '--http1.1',
          '--fail',
          '--location',
          '--connect-timeout',
          '30',
          '--retry',
          '3',
          '--retry-all-errors',
          '--retry-delay',
          '2',
          '--output',
          debPath,
          release.url,
        ]);
        await verifyChecksum(debPath, version, release.checksum);
      } catch (error) {
        throw new Error(`AOCC download failed: ${error.message}`);
      }
    }
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)(
    'setup-fortran-conda: Install AOCC Debian Package',
    async () => {
      try {
        const exitCode = await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['dpkg', '-i', debPath], {
          ignoreReturnCode: true,
        });
        if (exitCode !== 0) {
          await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'install', '-f', '-y']);
        }
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('AOCC Debian package installed');
      } catch (error) {
        throw new Error(`AOCC install failed: ${error.message}`);
      }
    }
  );

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .getCondaPrefix */ .s6)('fortran');
  const condaBin = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(prefix, 'bin');
  const aoccRoot = resolveAoccRoot(version);
  const setenvPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aoccRoot, 'setenv_AOCC.sh');
  const binPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aoccRoot, 'bin');
  const libPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aoccRoot, 'lib');
  const lib32Path = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aoccRoot, 'lib32');
  const wrapperDir = createAoccWrappers(binPath);

  if (!(0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(setenvPath)) {
    throw new Error(`Unable to locate AOCC environment script: ${setenvPath}`);
  }

  await sourceAoccEnvironment(setenvPath);
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .addExistingPaths */ .Bf)([condaBin, binPath, wrapperDir]);

  const ldLibraryPath = prependPathList(
    [libPath, lib32Path].filter(p => (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)),
    node_process__WEBPACK_IMPORTED_MODULE_7__.env.LD_LIBRARY_PATH || ''
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .verifyCommands */ .I6)([
    { command: 'amdflang', args: ['--version'] },
    { command: 'amdclang', args: ['-v'] },
    { command: 'amdclang++', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .compilerEnvironment */ .HD)('amdflang', 'amdclang', 'amdclang++', {
      AOCC_HOME: aoccRoot,
      AOCC_ROOT: aoccRoot,
      LD_LIBRARY_PATH: ldLibraryPath,
    })
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .setLinuxUlimits */ .QK)();
  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .exportProcessEnvironment */ .pI)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('✅ compiler setup complete');
}


/***/ }),

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
/* harmony export */   pI: () => (/* reexport safe */ _common_js__WEBPACK_IMPORTED_MODULE_4__.pI),
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
    (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.appendFileSync)(process.env.GITHUB_ENV, `BASH_ENV=${script}${node_os__WEBPACK_IMPORTED_MODULE_2__.EOL}`);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
  });
}


/***/ })

};
