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
    createCondaPackageSpec('flang', version),
    createCondaPackageSpec('clangxx', version),
    'libflang-rt',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths([join(condaPrefix, 'bin')]);

  const environment = createCompilerEnvironment('flang', 'clang', 'clang++', {
    LD_LIBRARY_PATH: prependPathEntries(
      [join(condaPrefix, 'lib')],
      process.env.LD_LIBRARY_PATH,
    ),
  });
  await exportCompilerEnvironment(environment);

  await verifyCommands([
    { command: 'flang', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
  ]);
  await configureLinuxUlimits();

  logCompilerSetupComplete();
}
