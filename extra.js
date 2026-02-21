import { exec as _exec } from '@actions/exec';
import { startGroup, endGroup, info } from '@actions/core';

export async function installExtras(env = 'fortran', extras = []) {
  const pkgs = ['fpm', 'cmake', 'ninja', 'meson', ...extras.map(p => p.trim()).filter(Boolean)];
  if (!pkgs.length) return;

  startGroup(`Installing extra packages: ${pkgs.join(', ')}`);
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    env,
    '-c',
    'conda-forge',
    ...pkgs
  ]);
  endGroup();

}