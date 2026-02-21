import { exec as _exec } from '@actions/exec';
import { startGroup, endGroup, info } from '@actions/core';

async function pinPackageInEnv(spec) {
  await _exec('conda', ['config', '--env', '--remove-key', 'pinned_packages'], {
    ignoreReturnCode: true,
    silent: true
  });

  await _exec('conda', ['config', '--env', '--add', 'pinned_packages', spec], {
    silent: true
  });
}

export async function installExtras(env = 'fortran', extras = [], fpmVersion = '') {
  const fpmPkg = fpmVersion ? `fpm=${fpmVersion}` : 'fpm';
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

  // Pin fpm if requested, so later installs can't upgrade it
  if (fpmVersion) {
    await pinPackageInEnv(env, `fpm==${fpmVersion}`);
    info(`Pinned: fpm==${fpmVersion}`);
  }
}