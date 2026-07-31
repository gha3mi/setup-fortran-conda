import { join } from 'node:path';
import {
  addExistingPaths,
  assertLinux,
  configureLinuxUlimits,
  createCompilerEnvironment,
  createCondaPackageSpec,
  exportCompilerEnvironment,
  getCondaPrefix,
  installCondaPackages,
  logCompilerSetupComplete,
  prependPathEntries,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

const INTEL_CHANNEL = 'https://software.repos.intel.com/python/conda/';

export async function setup(version = '') {
  assertLinux();

  const packages = [
    createCondaPackageSpec('ifx_linux-64', version),
    createCondaPackageSpec('intel-fortran-rt', version),
    createCondaPackageSpec('dpcpp-cpp-rt', version),
    createCondaPackageSpec('dpcpp_linux-64', version),
    createCondaPackageSpec('intel-sycl-rt', version),
    'llvm-openmp',
  ];
  await installCondaPackages(packages, {
    channels: [INTEL_CHANNEL, 'conda-forge'],
  });
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths([join(condaPrefix, 'bin')]);
  await verifyCommands([
    { command: 'ifx', args: ['--version'] },
    { command: 'icx', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('ifx', 'icx', 'icx', {
      LD_LIBRARY_PATH: prependPathEntries(
        [join(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    }),
  );
  await configureLinuxUlimits();

  logCompilerSetupComplete();
}
