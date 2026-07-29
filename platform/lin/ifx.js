import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertLinux,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportProcessEnvironment,
  getCondaPrefix,
  installCondaPackages,
  setLinuxUlimits,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

export async function setup(version = '') {
  assertLinux();

  const packages = [
    version ? `ifx_linux-64=${version}` : 'ifx_linux-64',
    version ? `intel-fortran-rt=${version}` : 'intel-fortran-rt',
    version ? `dpcpp-cpp-rt=${version}` : 'dpcpp-cpp-rt',
    version ? `dpcpp_linux-64=${version}` : 'dpcpp_linux-64',
    version ? `intel-sycl-rt=${version}` : 'intel-sycl-rt',
    'llvm-openmp',
  ];
  await installCondaPackages(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')]);
  await verifyCommands([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('ifx', 'icx', 'icx', {
      LD_LIBRARY_PATH: [join(prefix, 'lib'), process.env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
    })
  );
  await setLinuxUlimits();
  await exportProcessEnvironment();

  info('✅ compiler setup complete');
}
