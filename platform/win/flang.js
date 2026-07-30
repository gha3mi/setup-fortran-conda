import { info } from '@actions/core';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  compilerEnvironment,
  exportCompilerEnvironment,
  getCondaPrefix,
  initializeMsvcEnvironment,
  installCondaPackages,
  showCondaEnvironment,
  verifyCommands,
  windowsCondaPaths,
} from './common.js';

function clangRuntimeLibraryPaths(prefix) {
  const root = join(prefix, 'Library', 'lib', 'clang');
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map((version) =>
      join(root, version, 'lib', 'x86_64-pc-windows-msvc')
    )
    .filter((path) => existsSync(path));
}

export async function setup(version = '') {
  assertWindows();

  const packages = [
    version ? `flang=${version}` : 'flang',
    'flang-rt_win-64',
  ];
  await initializeMsvcEnvironment();
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  const libraryPath = join(prefix, 'Library', 'lib');
  const runtimeLibraryPaths = clangRuntimeLibraryPaths(prefix);
  await addExistingPaths([
    ...windowsCondaPaths(prefix),
    libraryPath,
    ...runtimeLibraryPaths,
  ]);
  await verifyCommands([
    { command: 'flang', args: ['--version'] },
    { command: 'clang-cl', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('flang', 'clang-cl', 'clang-cl', {
      INCLUDE: [join(prefix, 'Library', 'include'), process.env.INCLUDE || '']
        .filter(Boolean)
        .join(';'),
      LIB: [
        ...runtimeLibraryPaths,
        libraryPath,
        process.env.LIB || '',
      ]
        .filter(Boolean)
        .join(';'),
      AR: 'lib.exe',
    })
  );

  info('✅ compiler setup complete');
}
