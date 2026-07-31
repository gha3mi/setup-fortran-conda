import { join } from 'node:path';
import {
  CONDA_FORGE_CHANNEL,
  INTEL_CONDA_CHANNEL,
  prependPathEntries,
  setupCondaCompiler,
} from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: [
      'ifx_win-64',
      'intel-fortran-rt',
      'dpcpp-cpp-rt',
      'dpcpp_win-64',
      'intel-sycl-rt',
    ],
    packages: ['llvm-openmp'],
    channels: [INTEL_CONDA_CHANNEL, CONDA_FORGE_CHANNEL],
    compilers: { fortran: 'ifx', c: 'icx', cxx: 'icx' },
    requiresMsvc: true,
    createConfiguration: (condaPrefix) => ({
      environment: {
        INCLUDE: prependPathEntries(
          [
            join(condaPrefix, 'opt', 'compiler', 'include', 'intel64'),
            join(condaPrefix, 'Library', 'include'),
          ],
          process.env.INCLUDE,
        ),
        LIB: prependPathEntries(
          [join(condaPrefix, 'Library', 'lib')],
          process.env.LIB,
        ),
      },
    }),
  });
}
