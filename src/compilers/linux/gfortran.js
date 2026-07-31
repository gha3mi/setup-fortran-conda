import { setupCondaCompiler } from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: ['gfortran', 'gcc', 'gxx'],
    packages: ['binutils'],
    compilers: { fortran: 'gfortran', c: 'gcc', cxx: 'g++' },
  });
}
