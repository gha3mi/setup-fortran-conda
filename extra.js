import { exec as _exec } from '@actions/exec';
import { startGroup, endGroup } from '@actions/core';

export async function installExtras(env = 'fortran', extras = [], fpmVersion = '') {
  const v = (fpmVersion || '').trim().toLowerCase();
  const fpmPkg = (!v || v === 'latest') ? 'fpm' : `fpm=${v}`;
  const pkgs = [fpmPkg, 'cmake', 'ninja', 'meson', ...extras.map(p => p.trim()).filter(Boolean)];
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