import { installCondaPackages } from './platform/common.js';

export async function installExtras(env = 'fortran', extras = [], fpmVersion = '') {
  const v = (fpmVersion || '').trim().toLowerCase();
  const fpmPkg = !v || v === 'latest' ? 'fpm' : `fpm=${v}`;
  const packages = [
    fpmPkg,
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    ...extras.map((packageName) => packageName.trim()).filter(Boolean),
  ];
  if (!packages.length) return;

  await installCondaPackages(packages, {
    envName: env,
    successMessage: 'Extra packages installed',
    errorMessage: 'Extra package installation failed',
  });
}
