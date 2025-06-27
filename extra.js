import { exec as _exec } from '@actions/exec';
import { startGroup, endGroup, info } from '@actions/core';

export async function installExtras(env = 'fortran', extras = []) {
  const pkgs = ['fpm', 'doxygen', ...extras.map(p => p.trim()).filter(Boolean)];
  if (!pkgs.length) return;

  startGroup(`Installing extra packages: ${pkgs.join(', ')}`);
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    env,
    ...pkgs,
    '-c',
    'conda-forge',
  ]);
  endGroup();

  startGroup(`Installing pip-only packages in environment: ${env}`);
  await _exec('conda', ['run', '-n', env, 'pip', 'install', 'ford']);
  endGroup();

  info(`Installed: ${pkgs.join(', ')}, plus pip package: ford`);
}