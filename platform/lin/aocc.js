import { startGroup, endGroup, addPath, info, warning } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import {
  appendFileSync,
  chmodSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync
} from 'fs';
import { createHash } from 'crypto';
import { EOL, tmpdir } from 'os';
import { env, platform } from 'process';
import https from 'https';

const AOCC_DOWNLOAD_PAGE = 'https://www.amd.com/en/developer/aocc.html';

// Export a key=value pair to GITHUB_ENV and process.env
function exportEnv(key, value) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) throw new Error('GITHUB_ENV not defined');
  appendFileSync(envFile, `${key}=${value}${EOL}`);
  env[key] = value;
}

// Resolve the absolute path of a named conda environment
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

// Optional: Set unlimited ulimits for Linux
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

function normalizeVersion(version = '') {
  const v = version.trim().toLowerCase();
  if (!v || v === 'latest') return 'latest';

  const bare = v
    .replace(/^v/, '')
    .replace(/^aocc-compiler-/, '')
    .replace(/_1_amd64\.deb$/, '');
  const normalized = /^\d+\.\d+$/.test(bare) ? `${bare}.0` : bare;

  if (!/^\d+\.\d+\.\d+$/.test(normalized)) {
    throw new Error(`AOCC compiler-version must be "latest", major.minor, or major.minor.patch; got "${version}".`);
  }

  return normalized;
}

function aoccDebUrl(version) {
  const [major, minor] = version.split('.');
  return `https://download.amd.com/developer/eula/aocc/aocc-${major}-${minor}/aocc-compiler-${version}_1_amd64.deb`;
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
    const req = https.get(
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
        warning(`AOCC download page fetch failed (${err.message}); retrying.`);
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

    const directUrl = context.match(new RegExp(`https://download\\.amd\\.com[^"'\\s<>]*${escapeRegExp(filename)}`, 'i'));
    const href = context.match(new RegExp(`href=["']([^"']*${escapeRegExp(filename)}[^"']*)["']`, 'i'));
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
    info(`Resolved latest AOCC version: ${latest.version}`);
    return latest;
  }

  try {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const release = releases.find(r => r.version === normalized);
    if (release) return release;
  } catch (err) {
    warning(`Unable to read AOCC download page for checksum discovery: ${err.message}`);
  }

  return {
    version: normalized,
    url: aoccDebUrl(normalized),
    checksum: ''
  };
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
    warning(`No AOCC checksum is known for ${version}; skipping checksum verification.`);
    return;
  }

  const actual = await sha256File(file);
  if (actual !== expected) {
    throw new Error(`AOCC ${version} checksum mismatch: expected ${expected}, got ${actual}`);
  }

  info(`Verified AOCC ${version} SHA-256 checksum`);
}

function resolveAoccRoot(version) {
  const root = `/opt/AMD/aocc-compiler-${version}`;
  if (existsSync(root)) return root;

  const base = '/opt/AMD';
  if (existsSync(base)) {
    const matches = readdirSync(base)
      .filter(name => name === `aocc-compiler-${version}` || name.startsWith('aocc-compiler-'))
      .sort();
    const found = matches.find(name => name === `aocc-compiler-${version}`) || matches.at(-1);
    if (found) return join(base, found);
  }

  throw new Error(`Unable to locate AOCC installation under ${root}.`);
}

async function sourceAoccEnvironment(setenvPath) {
  let raw = '';
  await _exec('bash', ['-c', `source "${setenvPath}" >/dev/null && env -0`], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) }
  });

  for (const pair of raw.split('\0')) {
    if (!pair) continue;
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    env[pair.slice(0, idx)] = pair.slice(idx + 1);
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
  const wrapperPath = join(wrapperDir, name);
  writeFileSync(wrapperPath, `#!/usr/bin/env bash\nexec ${command} "$@"\n`);
  chmodSync(wrapperPath, 0o755);
}

function writeAmdflangWrapper(wrapperDir, compilerPath) {
  const wrapperPath = join(wrapperDir, 'amdflang');
  writeFileSync(wrapperPath, `#!/usr/bin/env bash
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
  chmodSync(wrapperPath, 0o755);
}

function createAoccWrappers(binPath) {
  const wrapperDir = join(process.env.RUNNER_TEMP || tmpdir(), 'setup-fortran-conda-aocc-bin');
  mkdirSync(wrapperDir, { recursive: true });

  const amdflangPath = existsSync(join(binPath, 'amdflang'))
    ? join(binPath, 'amdflang')
    : join(binPath, 'flang');
  writeAmdflangWrapper(wrapperDir, amdflangPath);

  if (!existsSync(join(binPath, 'amdclang'))) {
    writeWrapper(wrapperDir, 'amdclang', `"${join(binPath, 'clang')}"`);
  }
  if (!existsSync(join(binPath, 'amdclang++'))) {
    writeWrapper(wrapperDir, 'amdclang++', `"${join(binPath, 'clang++')}"`);
  }

  return wrapperDir;
}

// Main setup function
export async function setup(version = '') {
  if (platform !== 'linux') {
    throw new Error('This setup script is only supported on Linux.');
  }

  startGroup('setup-fortran-conda: Install AOCC System Dependencies');
  try {
    await _exec('sudo', ['apt-get', 'update', '-y']);
    await _exec('sudo', [
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
      'python3'
    ]);
  } catch (err) {
    throw new Error(`AOCC system dependency install failed: ${err.message}`);
  }
  endGroup();

  const release = await resolveAoccRelease(version);
  version = release.version;
  const debPath = join(tmpdir(), `aocc-compiler-${version}_1_amd64.deb`);

  startGroup('setup-fortran-conda: Download AOCC Debian Package');
  try {
    await _exec('curl', [
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
      release.url
    ]);
    await verifyChecksum(debPath, version, release.checksum);
  } catch (err) {
    throw new Error(`AOCC download failed: ${err.message}`);
  }
  endGroup();

  startGroup('setup-fortran-conda: Install AOCC Debian Package');
  try {
    const exitCode = await _exec('sudo', ['dpkg', '-i', debPath], { ignoreReturnCode: true });
    if (exitCode !== 0) {
      await _exec('sudo', ['apt-get', 'install', '-f', '-y']);
    }
    info('AOCC Debian package installed');
  } catch (err) {
    throw new Error(`AOCC install failed: ${err.message}`);
  }
  endGroup();

  const prefix = await getCondaPrefix('fortran');
  const condaBin = join(prefix, 'bin');
  const aoccRoot = resolveAoccRoot(version);
  const setenvPath = join(aoccRoot, 'setenv_AOCC.sh');
  const binPath = join(aoccRoot, 'bin');
  const libPath = join(aoccRoot, 'lib');
  const lib32Path = join(aoccRoot, 'lib32');
  const wrapperDir = createAoccWrappers(binPath);

  if (!existsSync(setenvPath)) {
    throw new Error(`Unable to locate AOCC environment script: ${setenvPath}`);
  }

  startGroup('setup-fortran-conda: Configure Compiler Paths');
  await sourceAoccEnvironment(setenvPath);

  for (const p of [condaBin, binPath, wrapperDir]) {
    if (existsSync(p)) {
      addPath(p);
      info(`Added to PATH: ${p}`);
    }
  }
  endGroup();

  const ldLibraryPath = prependPathList(
    [libPath, lib32Path].filter(p => existsSync(p)),
    env.LD_LIBRARY_PATH || ''
  );

  startGroup('setup-fortran-conda: Verify Compiler Commands');
  await _exec('which', ['amdflang']);
  await _exec('amdflang', ['--version']);
  await _exec('which', ['amdclang']);
  await _exec('amdclang', ['-v']);
  await _exec('which', ['amdclang++']);
  await _exec('amdclang++', ['--version']);
  endGroup();

  startGroup('setup-fortran-conda: Export Compiler Environment');
  const envVars = {
    AOCC_HOME: aoccRoot,
    AOCC_ROOT: aoccRoot,
    FC: 'amdflang',
    CC: 'amdclang',
    CXX: 'amdclang++',
    FPM_FC: 'amdflang',
    FPM_CC: 'amdclang',
    FPM_CXX: 'amdclang++',
    CMAKE_Fortran_COMPILER: 'amdflang',
    CMAKE_C_COMPILER: 'amdclang',
    CMAKE_CXX_COMPILER: 'amdclang++',
    LD_LIBRARY_PATH: ldLibraryPath
  };

  for (const [key, value] of Object.entries(envVars)) {
    exportEnv(key, value);
    info(`Exported: ${key}=${value}`);
  }
  endGroup();

  setLinuxUlimits();

  startGroup('setup-fortran-conda: Export Process Environment');
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      try {
        process.env[key] = value;
        appendFileSync(process.env.GITHUB_ENV, `${key}=${value}${EOL}`);
        info(`Exported: ${key}`);
      } catch (err) {
        info(`⚠️ Failed to export: ${key} (${err.message})`);
      }
    }
  }
  endGroup();

  info('✅ compiler setup complete');
}
