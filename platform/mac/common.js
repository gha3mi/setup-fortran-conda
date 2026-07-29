import { info } from '@actions/core';
import { exec as run } from '@actions/exec';
import { assertPlatform, exportEnv } from '../common.js';

export * from '../common.js';

export function assertMacOs() {
  assertPlatform('darwin', 'This setup script is only supported on macOS.');
}

export async function setMacOsSdkRoot() {
  let sdkPath = '';
  await run('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        sdkPath += data.toString();
      },
    },
  });

  sdkPath = sdkPath.trim();
  if (sdkPath) {
    exportEnv('SDKROOT', sdkPath);
  } else {
    info('⚠️ Failed to detect macOS SDK path.');
  }
}
