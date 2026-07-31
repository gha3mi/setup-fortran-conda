import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  createCompilerEnvironment,
  createCondaPackageSpec,
  exportCompilerEnvironment,
  getCondaExecutablePaths,
  getCondaPrefix,
  initializeMsvcEnvironment,
  installCondaPackages,
  logCompilerSetupComplete,
  prependPathEntries,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

export async function setup(version = '') {
  assertWindows();

  const packages = [
    createCondaPackageSpec('ifx_win-64', version),
    createCondaPackageSpec('intel-fortran-rt', version),
    createCondaPackageSpec('dpcpp-cpp-rt', version),
    createCondaPackageSpec('dpcpp_win-64', version),
    createCondaPackageSpec('intel-sycl-rt', version),
    'llvm-openmp',
  ];

  await initializeMsvcEnvironment();
  await installCondaPackages(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths(getCondaExecutablePaths(condaPrefix));
  await verifyCommands([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('ifx', 'icx', 'icx', {
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
    }),
  );

  logCompilerSetupComplete();
}
