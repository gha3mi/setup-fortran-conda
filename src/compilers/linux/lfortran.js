import { setupCondaCompiler } from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: ['lfortran'],
    packages: [
      'llvm',
      'llvm-tools',
      'clangxx',
      'clang-tools',
      'llvm-openmp',
      'lld',
    ],
    compilers: { fortran: 'lfortran', c: 'clang', cxx: 'clang++' },
    additionalVerificationCommands: [
      { command: 'llvm-dwarfdump', args: ['--version'] },
    ],
    environment: { LFORTRAN_LINKER: 'clang' },
  });
}
