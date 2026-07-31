import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  getCondaExecutablePaths,
  prependPathEntries,
  setupCondaCompiler,
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
  await setupCondaCompiler({
    version,
    versionedPackages: ['flang'],
    packages: ['flang-rt_win-64'],
    compilers: { fortran: 'flang', c: 'clang-cl', cxx: 'clang-cl' },
    requiresMsvc: true,
    createConfiguration: (condaPrefix) => {
      const libraryPath = join(condaPrefix, 'Library', 'lib');
      const runtimeLibraryPaths = getClangRuntimeLibraryPaths(condaPrefix);

      return {
        paths: [
          ...getCondaExecutablePaths(condaPrefix),
          libraryPath,
          ...runtimeLibraryPaths,
        ],
        environment: {
          INCLUDE: prependPathEntries(
            [join(condaPrefix, 'Library', 'include')],
            process.env.INCLUDE,
          ),
          LIB: prependPathEntries(
            [...runtimeLibraryPaths, libraryPath],
            process.env.LIB,
          ),
          AR: 'lib.exe',
        },
      };
    },
  });
}
