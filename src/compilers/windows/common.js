import {
  addExistingPaths,
  assertPlatform,
  createCompilerEnvironment,
  createCompilerVerificationCommands,
  exportCompilerEnvironment,
  getCondaExecutablePaths,
  getCondaPrefix,
  installCondaCompilerPackages,
  logCompilerSetupComplete,
  verifyCommands,
} from '../common.js';
import { initializeMsvcEnvironment } from './msvc.js';

export * from '../common.js';
export {
  createMsvcCommandArguments,
  initializeMsvcEnvironment,
} from './msvc.js';

export function assertWindows() {
  assertPlatform('win32', 'This setup script is only supported on Windows.');
}

export async function setupCondaCompiler({
  version = '',
  versionedPackages = [],
  packages = [],
  channels,
  compilers,
  requiresMsvc = false,
  additionalVerificationCommands = [],
  createConfiguration = () => ({}),
}) {
  assertWindows();

  if (requiresMsvc) {
    await initializeMsvcEnvironment();
  }

  await installCondaCompilerPackages({
    version,
    versionedPackages,
    packages,
    channels,
  });

  const condaPrefix = await getCondaPrefix();
  const configuration = await createConfiguration(condaPrefix);
  await configureWindowsCompiler({
    paths: configuration.paths || getCondaExecutablePaths(condaPrefix),
    compilers,
    environment: configuration.environment,
    additionalVerificationCommands,
  });
}

export async function configureWindowsCompiler({
  paths,
  compilers,
  environment = {},
  additionalVerificationCommands = [],
}) {
  assertWindows();

  await addExistingPaths(paths);
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
