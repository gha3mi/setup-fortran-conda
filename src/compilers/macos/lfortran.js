import { join } from 'node:path';
import {
  assertMacOs,
  configureMacOsCompiler,
  getCondaPrefix,
  installCondaCompilerPackages,
} from './common.js';

export async function setup(version = '') {
  assertMacOs();

  await installCondaCompilerPackages({
    version,
    versionedPackages: ['lfortran'],
    packages: [
      'git',
      'llvm',
      'llvm-tools',
      'clangxx',
      'clang-tools',
      'llvm-openmp',
    ],
  });

  const condaPrefix = await getCondaPrefix();
  await configureMacOsCompiler({
    paths: [join(condaPrefix, 'bin')],
    compilers: { fortran: 'lfortran', c: 'clang', cxx: 'clang++' },
    additionalVerificationCommands: [
      { command: 'llvm-dwarfdump', args: ['--version'] },
      { command: 'llvm-ar' },
      { command: 'llvm-ranlib' },
    ],
    environment: {
      FPM_AR: 'llvm-ar -c',
      AR: 'llvm-ar',
      RANLIB: 'llvm-ranlib',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      LFORTRAN_LINKER: 'clang',
    },
  });
}
