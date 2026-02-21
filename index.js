import fs from 'fs';
import path from 'path';

import { setFailed, summary } from '@actions/core';
import { exec as _exec } from '@actions/exec';

function safe(s) {
  return String(s || '').replace(/[^a-zA-Z0-9_.-]+/g, '_');
}

async function getVersion(cmd, args = ['--version']) {
  let output = '';
  try {
    await _exec(cmd, args, {
      listeners: {
        stdout: data => {
          output += data.toString();
        },
      },
    });
    return output.split('\n')[0].trim();
  } catch {
    return 'Unknown';
  }
}

async function condaPkgVersion(envName, pkgName) {
  let out = '';
  try {
    await _exec('conda', ['list', '--name', envName, '--json'], {
      silent: true,
      listeners: {
        stdout: d => {
          out += d.toString();
        },
      },
    });
    const list = JSON.parse(out);
    const hit = list.find(
      p => String(p.name).toLowerCase() === String(pkgName).toLowerCase()
    );
    return hit?.version || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function compilerCondaPkg(compiler, osKey) {
  switch (compiler) {
    case 'gfortran':
      return 'gfortran';

    case 'ifx':
      return osKey === 'win' ? 'ifx_win-64' : 'ifx_linux-64';

    case 'lfortran':
      return 'lfortran';

    case 'flang-new':
    case 'flang':
      return osKey === 'lin'
        ? 'flang_linux-64'
        : osKey === 'win'
          ? 'flang'
          : 'flang';

    case 'mpifort':
      return 'mpich';

    case 'nvfortran':
      return null;

    default:
      return null;
  }
}

function extractSemver(text) {
  const m = String(text).match(/([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);
  return m ? m[1] : 'Unknown';
}

async function run() {
  try {
    const compiler = (process.env.INPUT_COMPILER || '').toLowerCase();
    const requestedVersion = process.env.INPUT_COMPILER_VERSION || '';
    const platform = (process.env.INPUT_PLATFORM || '').toLowerCase();
    const extrasInput = process.env.INPUT_EXTRA_PACKAGES || '';
    const fpmVersion = process.env.INPUT_FPM_VERSION || '';

    const osKey = platform.includes('ubuntu')
      ? 'lin'
      : platform.includes('windows')
        ? 'win'
        : platform.includes('macos')
          ? 'mac'
          : undefined;

    if (!osKey) throw new Error(`Unsupported platform: ${platform}`);
    if (!compiler) throw new Error('INPUT_COMPILER is empty');

    // Install extra packages
    const { installExtras } = await import('./extra.js');
    const extras = extrasInput
      .split(/[\s,]+/)
      .map(p => p.trim())
      .filter(Boolean);
    await installExtras('fortran', extras, fpmVersion);

    // Install compiler
    const { setup } = await import(`./platform/${osKey}/${compiler}.js`);
    await setup(requestedVersion);

    const compilerVersionLine = await getVersion(compiler);

    let markerVersion = 'Unknown';
    const condaPkg = compilerCondaPkg(compiler, osKey);

    if (condaPkg) {
      markerVersion = await condaPkgVersion('fortran', condaPkg);
    } else if (compiler === 'nvfortran') {
      const defaultNv = '26.1';
      markerVersion = requestedVersion && requestedVersion.trim()
        ? requestedVersion.trim()
        : defaultNv;
    } else {
      markerVersion = extractSemver(compilerVersionLine);
    }

    console.log(`SFC_VERSION compiler=${compiler} os=${platform} version=${markerVersion}`);

    const job = process.env.GITHUB_JOB || 'job';
    const outDir = process.env.RUNNER_TEMP
      ? path.join(process.env.RUNNER_TEMP, 'sfc_versions')
      : path.join(process.cwd(), '.sfc_versions');

    fs.mkdirSync(outDir, { recursive: true });

    const payload = {
      compiler,
      platform,
      version: markerVersion,
      version_line: compilerVersionLine,
      run_id: process.env.GITHUB_RUN_ID || '',
      job,
      ts: new Date().toISOString(),
    };

    const outFile = path.join(
      outDir,
      `${safe(platform)}__${safe(compiler)}__${safe(job)}.json`
    );
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`SFC_VERSION_FILE ${outFile}`);

    // Write GitHub Actions summary
    await summary
      .addTable([
        ['OS', 'Compiler', 'Version', 'Version (short)'],
        [platform, compiler, compilerVersionLine, markerVersion],
      ])
      .write();
  } catch (err) {
    setFailed(err?.message || String(err));
  }
}

run();