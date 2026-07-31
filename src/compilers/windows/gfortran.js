import { join } from 'node:path';
import { prependPathEntries, setupCondaCompiler } from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: ['gfortran', 'gcc', 'gxx'],
    packages: ['binutils'],
    compilers: { fortran: 'gfortran', c: 'gcc', cxx: 'g++' },
    createConfiguration: (condaPrefix) => ({
      environment: {
        INCLUDE: prependPathEntries(
          [join(condaPrefix, 'Library', 'include')],
          process.env.INCLUDE,
        ),
      },
    }),
  });
}
