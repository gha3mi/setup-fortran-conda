import { info } from '@actions/core';
import { exportEnvironment } from '../lib/action.js';
import {
  createCondaPackageSpec,
  installCondaPackages,
  showCondaEnvironment,
} from '../lib/conda.js';

export {
  addExistingPaths,
  exportEnvironment,
  exportEnvironmentVariable,
  runInGroup,
  verifyCommands,
} from '../lib/action.js';
export {
  CONDA_FORGE_CHANNEL,
  createCondaPackageSpec,
  exportCondaEnvironment,
  getCondaExecutablePaths,
  getCondaPrefix,
  installCondaPackages,
  INTEL_CONDA_CHANNEL,
  showCondaEnvironment,
  TOOLS_ENVIRONMENT_NAME,
} from '../lib/conda.js';
export { prependPathEntries } from '../lib/environment.js';

export function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

export function createCompilerEnvironment(
  fortranCompiler,
  cCompiler,
  cxxCompiler,
  extraVariables = {},
) {
  return {
    FC: fortranCompiler,
    CC: cCompiler,
    CXX: cxxCompiler,
    FPM_FC: fortranCompiler,
    FPM_CC: cCompiler,
    FPM_CXX: cxxCompiler,
    CMAKE_Fortran_COMPILER: fortranCompiler,
    CMAKE_C_COMPILER: cCompiler,
    CMAKE_CXX_COMPILER: cxxCompiler,
    ...extraVariables,
  };
}

export function createCompilerVerificationCommands(
  compilers,
  additionalCommands = [],
) {
  const compilerCommands = [
    ...new Set([compilers.fortran, compilers.c, compilers.cxx].filter(Boolean)),
  ].map((command) => ({ command, args: ['--version'] }));

  return [...compilerCommands, ...additionalCommands];
}

export async function installCondaCompilerPackages({
  version = '',
  versionedPackages = [],
  packages = [],
  channels,
}) {
  const requestedPackages = [
    ...versionedPackages.map((name) => createCondaPackageSpec(name, version)),
    ...packages,
  ];
  await installCondaPackages(requestedPackages, { channels });
  await showCondaEnvironment();
}

export async function exportCompilerEnvironment(values) {
  await exportEnvironment(
    values,
    'setup-fortran-conda: Export Compiler Environment',
  );
}

export function logCompilerSetupComplete() {
  info('Compiler setup complete');
}
