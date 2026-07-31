import { join } from 'node:path';
import {
  addExistingPaths,
  assertMacOs,
  configureMacOsSdkRoot,
  createCompilerEnvironment,
  createCondaPackageSpec,
  exportCompilerEnvironment,
  getCondaPrefix,
  installCondaPackages,
  logCompilerSetupComplete,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertMacOs();

  const packages = [
    createCondaPackageSpec('lfortran', version),
    'git',
    'llvm',
    'llvm-tools',
    'clangxx',
    'clang-tools',
    'llvm-openmp',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths([join(condaPrefix, 'bin')], { log: false });
  await configureMacOsSdkRoot();

  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
    { command: 'llvm-ar' },
    { command: 'llvm-ranlib' },
  ]);
  await exportCompilerEnvironment(
    createCompilerEnvironment('lfortran', 'clang', 'clang++', {
      FPM_AR: 'llvm-ar -c',
      AR: 'llvm-ar',
      RANLIB: 'llvm-ranlib',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      LFORTRAN_LINKER: 'clang',
    }),
  );

  logCompilerSetupComplete();
}
