import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';

async function getCondaPrefix(envName) {
  let raw = '';
  await _exec('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) },
  });
  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
  }
  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

async function setMacOSSDKROOT() {
  let sdkPath = '';
  await _exec('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: { stdout: d => (sdkPath += d.toString()) },
  });
  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportVariable('SDKROOT', sdkPath);
    info(`Set SDKROOT → ${sdkPath}`);
  } else {
    info('Failed to detect macOS SDK path.');
  }
}

export async function setup(version = '') {
  throw new Error("Compiler 'flang' is not supported on macOS via Conda.");
}