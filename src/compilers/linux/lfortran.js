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
    createCondaPackageSpec('lfortran', version),
    'llvm',
    'llvm-tools',
    'clangxx',
    'clang-tools',
    'llvm-openmp',
    'lld',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  await addExistingPaths([join(condaPrefix, 'bin')]);
  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('lfortran', 'clang', 'clang++', {
      LFORTRAN_LINKER: 'clang',
      LD_LIBRARY_PATH: prependPathEntries(
        [join(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    }),
  );
  await configureLinuxUlimits();

  logCompilerSetupComplete();
}
