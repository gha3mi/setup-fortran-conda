import { existsSync, readdirSync } from 'node:fs';
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

function getClangRuntimeLibraryPaths(condaPrefix) {
  const root = join(condaPrefix, 'Library', 'lib', 'clang');
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((leftVersion, rightVersion) =>
      rightVersion.localeCompare(leftVersion, undefined, {
        numeric: true,
      }),
    )
    .map((version) => join(root, version, 'lib', 'x86_64-pc-windows-msvc'))
    .filter((candidate) => existsSync(candidate));
}

export async function setup(version = '') {
  assertWindows();

  const packages = [
    createCondaPackageSpec('flang', version),
    'flang-rt_win-64',
  ];
  await initializeMsvcEnvironment();
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const condaPrefix = await getCondaPrefix();
  const libraryPath = join(condaPrefix, 'Library', 'lib');
  const runtimeLibraryPaths = getClangRuntimeLibraryPaths(condaPrefix);
  await addExistingPaths([
    ...getCondaExecutablePaths(condaPrefix),
    libraryPath,
    ...runtimeLibraryPaths,
  ]);
  await verifyCommands([
    { command: 'flang', args: ['--version'] },
    { command: 'clang-cl', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    createCompilerEnvironment('flang', 'clang-cl', 'clang-cl', {
      INCLUDE: prependPathEntries(
        [join(condaPrefix, 'Library', 'include')],
        process.env.INCLUDE,
      ),
      LIB: prependPathEntries(
        [...runtimeLibraryPaths, libraryPath],
        process.env.LIB,
      ),
      AR: 'lib.exe',
    }),
  );

  logCompilerSetupComplete();
}
