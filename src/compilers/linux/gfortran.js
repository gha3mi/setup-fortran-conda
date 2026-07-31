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

export async function setup(version = '') {
  assertLinux();

  const packages = [
    createCondaPackageSpec('gfortran', version),
    createCondaPackageSpec('gcc', version),
    createCondaPackageSpec('gxx', version),
    'binutils',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths([join(condaPrefix, 'bin')]);
  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: 'gcc', args: ['--version'] },
    { command: 'g++', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('gfortran', 'gcc', 'g++', {
      LD_LIBRARY_PATH: prependPathEntries(
        [join(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    }),
  );
  await configureLinuxUlimits();

  logCompilerSetupComplete();
}
