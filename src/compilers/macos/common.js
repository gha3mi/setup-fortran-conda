import { info } from '@actions/core';
import { captureCommand } from '../../lib/command.js';
import { assertPlatform, exportEnvironmentVariable } from '../common.js';

export * from '../common.js';

export function assertMacOs() {
  assertPlatform('darwin', 'This setup script is only supported on macOS.');
}

export async function configureMacOsSdkRoot() {
  const result = await captureCommand('xcrun', [
    '--sdk',
    'macosx',
    '--show-sdk-path',
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`Unable to detect macOS SDK path: ${result.stderr}`);
  }

  const sdkPath = result.stdout.trim();
  if (sdkPath) {
    exportEnvironmentVariable('SDKROOT', sdkPath);
  } else {
    info('macOS SDK path was empty; SDKROOT was not exported');
  }
}
