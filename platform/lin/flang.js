import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertLinux,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportEnv,
  getCondaPrefix,
  installCondaPackages,
  setLinuxUlimits,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertLinux();

  const packages = [
    version ? `flang=${version}` : 'flang',
    version ? `clangxx=${version}` : 'clangxx',
    'libflang-rt',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')]);

  const ldLibraryPath = [
    join(prefix, 'lib'),
    process.env.LD_LIBRARY_PATH || '',
  ]
    .filter(Boolean)
    .join(':');
  exportEnv('LD_LIBRARY_PATH', ldLibraryPath);
  info('Exported: LD_LIBRARY_PATH');

  await verifyCommands([
    { command: 'flang', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
  ]);
  await exportCompilerEnvironment(
    compilerEnvironment('flang', 'clang', 'clang++', {
      LD_LIBRARY_PATH: ldLibraryPath,
    })
  );
  await setLinuxUlimits();

  info('✅ compiler setup complete');
}
