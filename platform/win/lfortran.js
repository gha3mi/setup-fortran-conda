import { info } from '@actions/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  TOOLS_ENVIRONMENT,
  addExistingPaths,
  assertWindows,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportEnv,
  exportProcessEnvironment,
  getCondaPrefix,
  grouped,
  initializeMsvcEnvironment,
  installCondaPackages,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

const COMPILER_ENVIRONMENT = 'setup-fortran-conda-lfortran';

async function removeConflictingLinkers() {
  await grouped('setup-fortran-conda: Clean Up PATH', async () => {
    const filtered = process.env.PATH.split(';').filter(
      (path) =>
        !/mingw/i.test(path) &&
        !/strawberry[\\/]c[\\/]bin/i.test(path)
    );
    exportEnv('PATH', filtered.join(';'));
    info('Removed conflicting linkers (MinGW, Strawberry Perl) from PATH');
  });
}

export async function setup(version = '') {
  assertWindows();

  const packages = [
    version ? `lfortran=${version}` : 'lfortran',
    ...(version ? [] : ['zstd=1.5.6']),
    'llvm',
    'llvm-tools',
    'clang-tools',
    'clangxx',
    'llvm-openmp',
    'lld',
    'gcc',
  ];
  let compilerPrefix = await getCondaPrefix(COMPILER_ENVIRONMENT, false);

  await initializeMsvcEnvironment();
  await removeConflictingLinkers();

  const condaCommand = compilerPrefix ? 'install' : 'create';
  await installCondaPackages(packages, {
    envName: COMPILER_ENVIRONMENT,
    command: condaCommand,
    commandOptions:
      condaCommand === 'create' ? ['--no-default-packages'] : [],
    successMessage: `Conda packages installed in ${COMPILER_ENVIRONMENT}`,
    errorMessage: 'Conda compiler environment setup failed',
  });
  await showCondaEnvironment([
    TOOLS_ENVIRONMENT,
    COMPILER_ENVIRONMENT,
  ]);

  compilerPrefix ||= await getCondaPrefix(COMPILER_ENVIRONMENT);
  const toolsPrefix = await getCondaPrefix(TOOLS_ENVIRONMENT);
  const variantBinPath = ['ucrt64', 'clang64', 'mingw64', 'clangarm64']
    .map((variant) =>
      join(compilerPrefix, 'Library', variant, 'bin')
    )
    .find((path) => existsSync(path));

  const compilerPaths = [
    variantBinPath,
    join(compilerPrefix, 'Library', 'mingw-w64', 'bin'),
    join(compilerPrefix, 'Library', 'usr', 'bin'),
    join(compilerPrefix, 'Library', 'bin'),
    join(compilerPrefix, 'bin'),
  ]
    .filter((path) => path && existsSync(path))
    .reverse();
  await addExistingPaths(compilerPaths);

  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
  ]);
  await exportCompilerEnvironment(
    compilerEnvironment('lfortran', 'clang', 'clang++', {
      INCLUDE: [
        join(toolsPrefix, 'Library', 'include'),
        join(compilerPrefix, 'Library', 'include'),
        process.env.INCLUDE || '',
      ]
        .filter(Boolean)
        .join(';'),
      LFORTRAN_LINKER: 'gcc',
      CMAKE_AR: 'llvm-ar',
      CMAKE_RANLIB: 'llvm-ranlib',
      CMAKE_LINKER: 'lld',
    })
  );
  await exportProcessEnvironment({ warningPrefix: '' });

  info('✅ compiler setup complete');
}
