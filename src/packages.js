import {
  createCondaPackageSpec,
  installCondaPackages,
  TOOLS_ENVIRONMENT_NAME,
} from './lib/conda.js';
import { normalizeRequestedVersion } from './lib/version.js';
import { createBlasPackageSpec } from './blas/support.js';

export function createExtraPackageSpecs(
  extraPackages = [],
  fpmVersion = '',
  blas = 'none',
) {
  const requestedFpmVersion =
    normalizeRequestedVersion(fpmVersion).toLowerCase();
  const blasPackageSpec = createBlasPackageSpec(blas);
  const normalizedExtraPackages = extraPackages
    .map((packageName) => packageName.trim())
    .filter(Boolean);

  return [
    createCondaPackageSpec('fpm', requestedFpmVersion),
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    ...(blasPackageSpec ? [blasPackageSpec] : []),
    ...normalizedExtraPackages,
  ];
}

export async function installExtras(
  environmentName = TOOLS_ENVIRONMENT_NAME,
  extraPackages = [],
  fpmVersion = '',
  blas = 'none',
) {
  const packages = createExtraPackageSpecs(extraPackages, fpmVersion, blas);

  await installCondaPackages(packages, {
    environmentName,
    successMessage: 'Extra packages installed',
    errorMessage: 'Extra package installation failed',
  });
}
