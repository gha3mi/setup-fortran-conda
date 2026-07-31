import { info } from '@actions/core';
import { captureCommand } from '../../lib/command.js';
import {
  addExistingPaths,
  assertPlatform,
  createCompilerEnvironment,
  createCompilerVerificationCommands,
  exportCompilerEnvironment,
  exportEnvironmentVariable,
  logCompilerSetupComplete,
  verifyCommands,
} from '../common.js';

export * from '../common.js';

export function assertMacOs() {
  assertPlatform('darwin', 'This setup script is only supported on macOS.');
}

export async function configureMacOsCompiler({
  paths,
  compilers,
  environment = {},
  additionalVerificationCommands = [],
}) {
  assertMacOs();

  await addExistingPaths(paths, { log: false });
  await configureMacOsSdkRoot();
  await verifyCommands(
    createCompilerVerificationCommands(
      compilers,
      additionalVerificationCommands,
    ),
  );
  await exportCompilerEnvironment(
    createCompilerEnvironment(
      compilers.fortran,
      compilers.c,
      compilers.cxx,
      environment,
    ),
  );

  logCompilerSetupComplete();
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
