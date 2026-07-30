export const id = 58;
export const ids = [58,994];
export const modules = {

/***/ 3058:
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










const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function normalizeVersion(version = '') {
  const v = version.trim().toLowerCase();
  if (!v || v === 'latest') return 'latest';

  const bare = v
    .replace(/^v/, '')
    .replace(/^rel_/, '')
    .replace(/^aomp-/, '')
    .replace(/\.tar\.gz$/, '');

  if (!/^\d+\.\d+-\d+$/.test(bare)) {
    throw new Error(
      'AOMP compiler-version must be "latest" or major.minor-patch, ' +
        `for example "23.0-0"; got "${version}".`
    );
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
    const req = node_https__WEBPACK_IMPORTED_MODULE_4__.get(
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
    const hash = (0,node_crypto__WEBPACK_IMPORTED_MODULE_2__.createHash)('sha256');
    const stream = (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.createReadStream)(file);
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
  if ((0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)((0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(root, 'bin', 'flang'))) return root;
  if (depth >= 5) return '';

  for (const entry of (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.readdirSync)(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const candidate = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(root, entry.name);
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
  (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .assertLinux */ .b4)('AOMP setup is only supported on Linux.');

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)(
    'setup-fortran-conda: Install AOMP System Dependencies',
    async () => {
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
          'python3',
        ]);
      } catch (error) {
        throw new Error(
          `AOMP system dependency install failed: ${error.message}`
        );
      }
    }
  );

  const release = await resolveAompRelease(version);
  const tarPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)((0,node_os__WEBPACK_IMPORTED_MODULE_5__.tmpdir)(), `aomp-${release.version}.tar.gz`);
  const extractDir = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(
    process.env.RUNNER_TEMP || (0,node_os__WEBPACK_IMPORTED_MODULE_5__.tmpdir)(),
    `setup-fortran-conda-aomp-${release.version}`
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)(
    'setup-fortran-conda: Download AOMP Binary Tarball',
    async () => {
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
          release.url,
        ]);
        await verifyChecksum(tarPath, release.version, release.checksum);
      } catch (error) {
        throw new Error(`AOMP download failed: ${error.message}`);
      }
    }
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .grouped */ .zD)('setup-fortran-conda: Extract AOMP', async () => {
    (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.mkdirSync)(extractDir, { recursive: true });
    try {
      await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__/* .exec */ .m)('tar', ['-xzf', tarPath, '-C', extractDir]);
    } catch (error) {
      throw new Error(`AOMP extraction failed: ${error.message}`);
    }
  });

  const aompRoot = findAompRoot(extractDir);
  if (!aompRoot) {
    throw new Error(`Unable to locate AOMP installation root under ${extractDir}.`);
  }

  const prefix = await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .getCondaPrefix */ .s6)('fortran');
  const condaBin = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(prefix, 'bin');
  const binPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aompRoot, 'bin');

  const libPath = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aompRoot, 'lib');
  const lib64Path = (0,node_path__WEBPACK_IMPORTED_MODULE_6__.join)(aompRoot, 'lib64');
  const ldLibraryPath = prependPathList(
    [libPath, lib64Path].filter(p => (0,node_fs__WEBPACK_IMPORTED_MODULE_3__.existsSync)(p)),
    node_process__WEBPACK_IMPORTED_MODULE_7__.env.LD_LIBRARY_PATH || ''
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .addExistingPaths */ .Bf)([condaBin, binPath]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .verifyCommands */ .I6)([
    { command: 'flang', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
  ]);

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .exportCompilerEnvironment */ .x7)(
    (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .compilerEnvironment */ .HD)('flang', 'clang', 'clang++', {
      AOMP_HOME: aompRoot,
      AOMP_ROOT: aompRoot,
      AOMP_VERSION: release.version,
      LD_LIBRARY_PATH: ldLibraryPath,
    })
  );

  await (0,_common_js__WEBPACK_IMPORTED_MODULE_8__/* .setLinuxUlimits */ .QK)();

  (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)('AOMP compiler setup complete');
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
