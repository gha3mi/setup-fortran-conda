import { info } from '@actions/core';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertLinux,
  compilerEnvironment,
  exportCompilerEnvironment,
  getCondaPrefix,
  installCondaPackages,
  setLinuxUlimits,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

export async function setup(version = '') {
  assertLinux();

  const packages = [
    version ? `lfortran=${version}` : 'lfortran',
    'llvm',
    'llvm-tools',
    'clangxx',
    'clang-tools',
    'llvm-openmp',
    'lld',
  ];
  await installCondaPackages(packages);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  await addExistingPaths([join(prefix, 'bin')]);
  await verifyCommands([
    { command: 'lfortran', args: ['--version'] },
    { command: 'clang', args: ['--version'] },
    { command: 'clang++', args: ['--version'] },
    { command: 'llvm-dwarfdump', args: ['--version'] },
  ]);

  await exportCompilerEnvironment(
    compilerEnvironment('lfortran', 'clang', 'clang++', {
      LFORTRAN_LINKER: 'clang',
      LD_LIBRARY_PATH: [join(prefix, 'lib'), process.env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
    })
  );
  await setLinuxUlimits();

  info('✅ compiler setup complete');
}
