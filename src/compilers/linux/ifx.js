import {
  CONDA_FORGE_CHANNEL,
  INTEL_CONDA_CHANNEL,
  setupCondaCompiler,
} from './common.js';

export async function setup(version = '') {
  await setupCondaCompiler({
    version,
    versionedPackages: [
      'ifx_linux-64',
      'intel-fortran-rt',
      'dpcpp-cpp-rt',
      'dpcpp_linux-64',
      'intel-sycl-rt',
    ],
    packages: ['llvm-openmp'],
    channels: [INTEL_CONDA_CHANNEL, CONDA_FORGE_CHANNEL],
    compilers: { fortran: 'ifx', c: 'icx', cxx: 'icx' },
  });
}
