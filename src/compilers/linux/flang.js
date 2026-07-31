import { setupCondaCompiler } from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: ['flang', 'clangxx'],
    packages: ['libflang-rt'],
    compilers: { fortran: 'flang', c: 'clang', cxx: 'clang++' },
  });
}
