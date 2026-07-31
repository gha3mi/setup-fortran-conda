import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  createCompilerEnvironment,
  createCondaPackageSpec,
  exportCompilerEnvironment,
  getCondaExecutablePaths,
  getCondaPrefix,
  installCondaPackages,
  logCompilerSetupComplete,
  prependPathEntries,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertWindows();

  const packages = [
    createCondaPackageSpec('gfortran', version),
    createCondaPackageSpec('gcc', version),
    createCondaPackageSpec('gxx', version),
    'binutils',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths(getCondaExecutablePaths(condaPrefix));
  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: 'gcc', args: ['--version'] },
    { command: 'g++', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('gfortran', 'gcc', 'g++', {
      INCLUDE: prependPathEntries(
        [join(condaPrefix, 'Library', 'include')],
        process.env.INCLUDE,
      ),
    }),
  );

  logCompilerSetupComplete();
}
