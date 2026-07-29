import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertLinux,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportProcessEnvironment,
  getCondaPrefix,
  installCondaPackages,
  setLinuxUlimits,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertLinux();

  const packages = [
    version ? `gfortran=${version}` : 'gfortran',
    version ? `gcc_linux-64=${version}` : 'gcc_linux-64',
    version ? `gxx=${version}` : 'gxx',
    'binutils',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')]);
  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: 'gcc', args: ['--version'] },
    { command: 'g++', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('gfortran', 'gcc', 'g++', {
      LD_LIBRARY_PATH: [join(prefix, 'lib'), process.env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
    })
  );
  await setLinuxUlimits();
  await exportProcessEnvironment();

  info('✅ compiler setup complete');
}
