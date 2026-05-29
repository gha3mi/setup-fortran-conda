import { startGroup, endGroup, addPath, info, warning } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync
} from 'fs';
import { createHash } from 'crypto';
import { EOL, tmpdir } from 'os';
import { join, sep } from 'path';
import { env, platform } from 'process';
import https from 'https';

const AOMP_REPO_API = 'https://api.github.com/repos/ROCm/aomp/releases';

function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  appendFileSync(envFile, `${key}=${value}${EOL}`);
  env[key] = value;
}

function setLinuxUlimits() {
  startGroup('setup-fortran-conda: Configure Linux Environment');
  const ulimitCmd =
    'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
  const script = `${process.env.RUNNER_TEMP}/ulimit.sh`;
  appendFileSync(script, `${ulimitCmd}${EOL}`);
  appendFileSync(process.env.GITHUB_ENV, `BASH_ENV=${script}${EOL}`);
  info('ulimit settings exported to BASH_ENV');
  endGroup();
}

async function getCondaPrefix(envName) {
  let raw = '';
  await _exec('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });

  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
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
    const req = https.get(
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

  info(`Resolved latest AOMP version: ${latest.version}`);
  return latest;
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(file);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyChecksum(file, version, expected) {
  if (!expected) {
    warning(`No AOMP checksum is known for ${version}; skipping checksum verification.`);
    return;
  }

  const actual = await sha256File(file);
  if (actual !== expected) {
    throw new Error(`AOMP ${version} checksum mismatch: expected ${expected}, got ${actual}`);
  }

  info(`Verified AOMP ${version} SHA-256 checksum`);
}

function findAompRoot(root, depth = 0) {
  if (existsSync(join(root, 'bin', 'flang'))) return root;
  if (depth >= 5) return '';

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const candidate = join(root, entry.name);
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

export async function setup(version = '') {
  if (platform !== 'linux') {
    throw new Error('AOMP setup is only supported on Linux.');
  }

  startGroup('setup-fortran-conda: Install AOMP System Dependencies');
  try {
    await _exec('sudo', ['apt-get', 'update', '-y']);
    await _exec('sudo', [
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
  endGroup();

  const release = await resolveAompRelease(version);
  const tarPath = join(tmpdir(), `aomp-${release.version}.tar.gz`);
  const extractDir = join(process.env.RUNNER_TEMP || tmpdir(), `setup-fortran-conda-aomp-${release.version}`);

  startGroup('setup-fortran-conda: Download AOMP Binary Tarball');
  try {
    await _exec('curl', [
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
  endGroup();

  startGroup('setup-fortran-conda: Extract AOMP');
  mkdirSync(extractDir, { recursive: true });
  try {
    await _exec('tar', ['-xzf', tarPath, '-C', extractDir]);
  } catch (err) {
    throw new Error(`AOMP extraction failed: ${err.message}`);
  }
  endGroup();

  const aompRoot = findAompRoot(extractDir);
  if (!aompRoot) {
    throw new Error(`Unable to locate AOMP installation root under ${extractDir}.`);
  }

  const prefix = await getCondaPrefix('fortran');
  const condaBin = join(prefix, 'bin');
  const binPath = join(aompRoot, 'bin');

  const libPath = join(aompRoot, 'lib');
  const lib64Path = join(aompRoot, 'lib64');
  const ldLibraryPath = prependPathList(
    [libPath, lib64Path].filter(p => existsSync(p)),
    env.LD_LIBRARY_PATH || ''
  );

  startGroup('setup-fortran-conda: Configure Compiler Paths');
  for (const p of [condaBin, binPath]) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  startGroup('setup-fortran-conda: Verify Compiler Commands');
  await _exec('which', ['flang']);
  await _exec('flang', ['--version']);
  await _exec('which', ['clang']);
  await _exec('clang', ['--version']);
  await _exec('which', ['clang++']);
  await _exec('clang++', ['--version']);
  endGroup();

  startGroup('setup-fortran-conda: Export Compiler Environment');
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
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  setLinuxUlimits();

  info('AOMP compiler setup complete');
}
