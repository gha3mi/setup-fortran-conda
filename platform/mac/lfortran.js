import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertMacOs,
  compilerEnvironment,
  exportCompilerEnvironment,
  getCondaPrefix,
  installCondaPackages,
  setMacOsSdkRoot,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertMacOs();

  const packages = [
    version ? `lfortran=${version}` : 'lfortran',
    'git',
    'llvm',
    'llvm-tools',
    'clangxx',
    'clang-tools',
    'llvm-openmp',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')], { log: false });
  await setMacOsSdkRoot();

  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
    { command: 'llvm-ar' },
    { command: 'llvm-ranlib' },
  ]);
  await exportCompilerEnvironment(
    compilerEnvironment('lfortran', 'clang', 'clang++', {
      FPM_AR: 'llvm-ar -c',
      AR: 'llvm-ar',
      RANLIB: 'llvm-ranlib',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      LFORTRAN_LINKER: 'clang',
    })
  );

  info('✅ compiler setup complete');
}
