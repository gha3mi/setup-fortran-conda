import {
  createCondaPackageSpec,
  installCondaPackages,
  TOOLS_ENVIRONMENT_NAME,
} from './compilers/common.js';

export function createExtraPackageSpecs(extraPackages = [], fpmVersion = '') {
  const normalizedFpmVersion = String(fpmVersion || '')
    .trim()
    .toLowerCase();
  const requestedFpmVersion =
    normalizedFpmVersion === 'latest' ? '' : normalizedFpmVersion;
  return [
    createCondaPackageSpec('fpm', requestedFpmVersion),
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    ...extraPackages.map((packageName) => packageName.trim()).filter(Boolean),
  ];
}

export async function installExtras(
  environmentName = TOOLS_ENVIRONMENT_NAME,
  extraPackages = [],
  fpmVersion = '',
) {
  const packages = createExtraPackageSpecs(extraPackages, fpmVersion);

  await installCondaPackages(packages, {
    environmentName,
    successMessage: 'Extra packages installed',
    errorMessage: 'Extra package installation failed',
  });
}
