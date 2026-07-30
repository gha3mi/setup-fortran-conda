import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportProcessEnvironment,
  getCondaPrefix,
  initializeMsvcEnvironment,
  installCondaPackages,
  showCondaEnvironment,
  verifyCommands,
  windowsCondaPaths,
} from './common.js';

const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

export async function setup(version = '') {
  assertWindows();

  const packages = [
    version ? `ifx_win-64=${version}` : 'ifx_win-64',
    version ? `intel-fortran-rt=${version}` : 'intel-fortran-rt',
    version ? `dpcpp-cpp-rt=${version}` : 'dpcpp-cpp-rt',
    version ? `dpcpp_win-64=${version}` : 'dpcpp_win-64',
    version ? `intel-sycl-rt=${version}` : 'intel-sycl-rt',
    'llvm-openmp',
  ];

  await initializeMsvcEnvironment();
  await installCondaPackages(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths(windowsCondaPaths(prefix));
  await verifyCommands([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('ifx', 'icx', 'icx', {
      INCLUDE: [
        join(prefix, 'opt', 'compiler', 'include', 'intel64'),
        join(prefix, 'Library', 'include'),
        process.env.INCLUDE || '',
      ]
        .filter(Boolean)
        .join(';'),
      LIB: [join(prefix, 'Library', 'lib'), process.env.LIB || '']
        .filter(Boolean)
        .join(';'),
    })
  );
  await exportProcessEnvironment({ warningPrefix: '' });

  info('✅ compiler setup complete');
}
