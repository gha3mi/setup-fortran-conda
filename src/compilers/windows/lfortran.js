import { info } from '@actions/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  createCompilerEnvironment,
  createCondaPackageSpec,
  exportCompilerEnvironment,
  exportEnvironmentVariable,
  getCondaPrefix,
  initializeMsvcEnvironment,
  installCondaPackages,
  logCompilerSetupComplete,
  prependPathEntries,
  runInGroup,
  showCondaEnvironment,
  TOOLS_ENVIRONMENT_NAME,
  verifyCommands,
} from './common.js';

const COMPILER_ENVIRONMENT_NAME = 'setup-fortran-conda-lfortran';

async function removeConflictingLinkers() {
  await runInGroup('setup-fortran-conda: Clean Up PATH', async () => {
    const filteredPaths = String(process.env.PATH || '')
      .split(';')
      .filter(
        (pathEntry) =>
          !/mingw/i.test(pathEntry) &&
          !/strawberry[\\/]c[\\/]bin/i.test(pathEntry),
      );
    exportEnvironmentVariable('PATH', filteredPaths.join(';'));
    info('Removed conflicting linkers (MinGW, Strawberry Perl) from PATH');
  });
}

export async function setup(version = '') {
  assertWindows();

  const packages = [
    createCondaPackageSpec('lfortran', version),
    ...(version ? [] : ['zstd=1.5.6']),
    'llvm',
    'llvm-tools',
    'clang-tools',
    'clangxx',
    'llvm-openmp',
    'lld',
    'gcc',
  ];
  let compilerPrefix = await getCondaPrefix(COMPILER_ENVIRONMENT_NAME, false);

  await initializeMsvcEnvironment();
  await removeConflictingLinkers();

  const condaCommand = compilerPrefix ? 'install' : 'create';
  await installCondaPackages(packages, {
    environmentName: COMPILER_ENVIRONMENT_NAME,
    command: condaCommand,
    commandOptions: condaCommand === 'create' ? ['--no-default-packages'] : [],
    successMessage: `Conda packages installed in ${COMPILER_ENVIRONMENT_NAME}`,
    errorMessage: 'Conda compiler environment setup failed',
  });
  await showCondaEnvironment([
    TOOLS_ENVIRONMENT_NAME,
    COMPILER_ENVIRONMENT_NAME,
  ]);

  compilerPrefix ||= await getCondaPrefix(COMPILER_ENVIRONMENT_NAME);
  const toolsPrefix = await getCondaPrefix(TOOLS_ENVIRONMENT_NAME);
  const variantBinDirectory = ['ucrt64', 'clang64', 'mingw64', 'clangarm64']
    .map((variant) => join(compilerPrefix, 'Library', variant, 'bin'))
    .find((candidate) => existsSync(candidate));

  const compilerPaths = [
    variantBinDirectory,
    join(compilerPrefix, 'Library', 'mingw-w64', 'bin'),
    join(compilerPrefix, 'Library', 'usr', 'bin'),
    join(compilerPrefix, 'Library', 'bin'),
    join(compilerPrefix, 'bin'),
  ]
    .filter((candidate) => candidate && existsSync(candidate))
    .reverse();
  await addExistingPaths(compilerPaths);

  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
  ]);
  await exportCompilerEnvironment(
    createCompilerEnvironment('lfortran', 'clang', 'clang++', {
      INCLUDE: prependPathEntries(
        [
          join(toolsPrefix, 'Library', 'include'),
          join(compilerPrefix, 'Library', 'include'),
        ],
        process.env.INCLUDE,
      ),
      LFORTRAN_LINKER: 'gcc',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      CMAKE_LINKER: 'lld',
    }),
  );

  logCompilerSetupComplete();
}
