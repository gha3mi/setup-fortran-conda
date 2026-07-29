export const id = 58;
export const ids = [58];
export const modules = {

/***/ 3058:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setup: () => (/* binding */ setup)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7264);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2876);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9896);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6982);
/* harmony import */ var os__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(857);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6928);
/* harmony import */ var process__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(932);
/* harmony import */ var https__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(5692);









const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  (0,fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(envFile, `${key}=${value}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  process__WEBPACK_IMPORTED_MODULE_6__.env[key] = value;
}

function setLinuxUlimits() {
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Linux Environment');
  const ulimitCmd =
    'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
  const script = `${process.env.RUNNER_TEMP}/ulimit.sh`;
  (0,fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(script, `${ulimitCmd}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  (0,fs__WEBPACK_IMPORTED_MODULE_2__.appendFileSync)(process.env.GITHUB_ENV, `BASH_ENV=${script}${os__WEBPACK_IMPORTED_MODULE_4__.EOL}`);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('ulimit settings exported to BASH_ENV');
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();
}

async function getCondaPrefix(envName) {
  let raw = '';
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });

  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(path__WEBPACK_IMPORTED_MODULE_5__.sep + envName) || p.endsWith('/' + envName)) return p;
  }

  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

function normalizeVersion(version = '') {
  const v = version.trim().toLowerCase();
  if (!v || v === 'latest') return 'latest';

  const bare = v
    .replace(/^v/, '')
    .replace(/^rel_/, '')
    .replace(/^aomp-/, '')
    .replace(/\.tar\.gz$/, '');

  if (!/^\d+\.\d+-\d+$/.test(bare)) {
    throw new Error(`AOMP compiler-version must be "latest" or major.minor-patch, for example "23.0-0"; got "${version}".`);
  }

  return bare;
}

function compareAompVersions(a, b) {
  const parse = (v) => v.split(/[.-]/).map(Number);
  const av = parse(a);
  const bv = parse(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i++) {
    const diff = (av[i] || 0) - (bv[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

function httpsGetJson(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https__WEBPACK_IMPORTED_MODULE_7__.get(
      url,
      {
        headers: {
          'User-Agent': 'setup-fortran-conda',
          Accept: 'application/vnd.github+json',
        },
        timeout: 60000,
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = res.headers.location;

        if (status >= 300 && status < 400 && location && redirects > 0) {
          res.resume();
          resolve(httpsGetJson(new URL(location, url).toString(), redirects - 1));
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
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Failed to parse ${url}: ${err.message}`));
          }
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error(`Timed out fetching ${url}`)));
    req.on('error', reject);
  });
}

function releaseFromAsset(release) {
  for (const asset of release.assets || []) {
    const match = String(asset.name || '').match(/^aomp-(\d+\.\d+-\d+)\.tar\.gz$/);
    if (!match) continue;

    return {
      version: match[1],
      tag: release.tag_name,
      url: asset.browser_download_url,
      checksum: String(asset.digest || '').replace(/^sha256:/, ''),
    };
  }

  return null;
}

async function resolveAompRelease(requestedVersion = '') {
  const normalized = normalizeVersion(requestedVersion);

  if (normalized !== 'latest') {
    const release = await httpsGetJson(`${AOMP_REPO_API}/tags/rel_${normalized}`);
    const resolved = releaseFromAsset(release);
    if (resolved) return resolved;
    throw new Error(`Unable to locate AOMP binary tarball for ${normalized}.`);
  }

  const releases = await httpsGetJson(`${AOMP_REPO_API}?per_page=100`);
  const candidates = releases
    .map(releaseFromAsset)
    .filter(Boolean)
    .sort((a, b) => compareAompVersions(b.version, a.version));

  const latest = candidates[0];
  if (!latest) {
    throw new Error('Unable to resolve latest AOMP binary tarball from ROCm/aomp releases.');
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest AOMP version: ${latest.version}`);
  return latest;
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,crypto__WEBPACK_IMPORTED_MODULE_3__.createHash)('sha256');
    const stream = (0,fs__WEBPACK_IMPORTED_MODULE_2__.createReadStream)(file);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyChecksum(file, version, expected) {
  if (!expected) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(`No AOMP checksum is known for ${version}; skipping checksum verification.`);
    return;
  }

  const actual = await sha256File(file);
  if (actual !== expected) {
    throw new Error(`AOMP ${version} checksum mismatch: expected ${expected}, got ${actual}`);
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Verified AOMP ${version} SHA-256 checksum`);
}

function findAompRoot(root, depth = 0) {
  if ((0,fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)((0,path__WEBPACK_IMPORTED_MODULE_5__.join)(root, 'bin', 'flang'))) return root;
  if (depth >= 5) return '';

  for (const entry of (0,fs__WEBPACK_IMPORTED_MODULE_2__.readdirSync)(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const candidate = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(root, entry.name);
    const found = findAompRoot(candidate, depth + 1);
    if (found) return found;
  }

  return '';
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

async function setup(version = '') {
  if (process__WEBPACK_IMPORTED_MODULE_6__.platform !== 'linux') {
    throw new Error('AOMP setup is only supported on Linux.');
  }

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Install AOMP System Dependencies');
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', ['apt-get', 'update', '-y']);
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('sudo', [
      'apt-get',
      'install',
      '-y',
      'ca-certificates',
      'curl',
      'tar',
      'gzip',
      'libstdc++6',
      'libtinfo6',
      'libxml2',
      'libdrm2',
      'zlib1g',
      'python3'
    ]);
  } catch (err) {
    throw new Error(`AOMP system dependency install failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  const release = await resolveAompRelease(version);
  const tarPath = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)((0,os__WEBPACK_IMPORTED_MODULE_4__.tmpdir)(), `aomp-${release.version}.tar.gz`);
  const extractDir = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(process.env.RUNNER_TEMP || (0,os__WEBPACK_IMPORTED_MODULE_4__.tmpdir)(), `setup-fortran-conda-aomp-${release.version}`);

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Download AOMP Binary Tarball');
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('curl', [
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
      tarPath,
      release.url
    ]);
    await verifyChecksum(tarPath, release.version, release.checksum);
  } catch (err) {
    throw new Error(`AOMP download failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Extract AOMP');
  (0,fs__WEBPACK_IMPORTED_MODULE_2__.mkdirSync)(extractDir, { recursive: true });
  try {
    await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('tar', ['-xzf', tarPath, '-C', extractDir]);
  } catch (err) {
    throw new Error(`AOMP extraction failed: ${err.message}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  const aompRoot = findAompRoot(extractDir);
  if (!aompRoot) {
    throw new Error(`Unable to locate AOMP installation root under ${extractDir}.`);
  }

  const prefix = await getCondaPrefix('fortran');
  const condaBin = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(prefix, 'bin');
  const binPath = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'bin');

  const libPath = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib');
  const lib64Path = (0,path__WEBPACK_IMPORTED_MODULE_5__.join)(aompRoot, 'lib64');
  const ldLibraryPath = prependPathList(
    [libPath, lib64Path].filter(p => (0,fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(p)),
    process__WEBPACK_IMPORTED_MODULE_6__.env.LD_LIBRARY_PATH || ''
  );

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Configure Compiler Paths');
  for (const p of [condaBin, binPath]) {
    if ((0,fs__WEBPACK_IMPORTED_MODULE_2__.existsSync)(p)) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .addPath */ .fM)(p);
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Added to PATH: ${p}`);
    }
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Verify Compiler Commands');
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['flang']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('flang', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['clang']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang', ['--version']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('which', ['clang++']);
  await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('clang++', ['--version']);
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .startGroup */ .Oh)('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    AOMP_HOME: aompRoot,
    AOMP_ROOT: aompRoot,
    AOMP_VERSION: release.version,
    FC: 'flang',
    CC: 'clang',
    CXX: 'clang++',
    FPM_FC: 'flang',
    FPM_CC: 'clang',
    FPM_CXX: 'clang++',
    CMAKE_Fortran_COMPILER: 'flang',
    CMAKE_C_COMPILER: 'clang',
    CMAKE_CXX_COMPILER: 'clang++',
    LD_LIBRARY_PATH: ldLibraryPath
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Exported: ${key}=${value}`);
  }
  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .endGroup */ .N4)();

  setLinuxUlimits();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('AOMP compiler setup complete');
}


/***/ })

};
