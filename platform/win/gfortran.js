import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertWindows,
  compilerEnvironment,
  exportCompilerEnvironment,
  getCondaPrefix,
  installCondaPackages,
  showCondaEnvironment,
  verifyCommands,
  windowsCondaPaths,
} from './common.js';

export async function setup(version = '') {
  assertWindows();

  const packages = [
    version ? `gfortran=${version}` : 'gfortran',
    version ? `gcc=${version}` : 'gcc',
    version ? `gxx=${version}` : 'gxx',
    'binutils',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths(windowsCondaPaths(prefix));
  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: 'gcc', args: ['--version'] },
    { command: 'g++', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('gfortran', 'gcc', 'g++', {
      INCLUDE: [join(prefix, 'Library', 'include'), process.env.INCLUDE || '']
        .filter(Boolean)
        .join(';'),
    })
  );

  info('✅ compiler setup complete');
}
