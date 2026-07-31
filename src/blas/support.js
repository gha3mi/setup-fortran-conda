import { captureCommand } from '../lib/command.js';
import { getErrorMessage } from '../lib/errors.js';
import { TOOLS_ENVIRONMENT_NAME } from '../compilers/common.js';

export const BLAS_IMPLEMENTATIONS = Object.freeze([
  'none',
  'netlib',
  'openblas',
  'mkl',
  'accelerate',
]);

const REQUIRED_BLAS_PACKAGES = Object.freeze([
  'blas-devel',
  'libblas',
  'liblapack',
]);

export function assertBlasSupported(implementation) {
  if (!BLAS_IMPLEMENTATIONS.includes(implementation)) {
    throw new Error(
      `Unsupported BLAS/LAPACK implementation: ${implementation}. ` +
        `Supported values: ${BLAS_IMPLEMENTATIONS.join(', ')}.`,
    );
  }
}

export function createBlasPackageSpec(implementation) {
  assertBlasSupported(implementation);
  return implementation === 'none' ? '' : `blas-devel=*=*_${implementation}`;
}

export function validateBlasPackages(packages, implementation) {
  assertBlasSupported(implementation);
  if (implementation === 'none') {
    return {};
  }
  if (!Array.isArray(packages)) {
    throw new Error('Unable to validate BLAS/LAPACK packages.');
  }

  const expectedBuildSuffix = `_${implementation}`;
  const selectedPackages = {};

  for (const packageName of REQUIRED_BLAS_PACKAGES) {
    const installedPackage = packages.find(
      (candidate) => candidate?.name === packageName,
    );
    if (!installedPackage) {
      throw new Error(
        `The requested ${implementation} implementation did not install ${packageName}.`,
      );
    }

    const build = String(
      installedPackage.build_string ?? installedPackage.build ?? '',
    );
    if (!build.endsWith(expectedBuildSuffix)) {
      throw new Error(
        `${packageName} uses build "${build}", expected an exact ` +
          `${implementation} provider build ending in "${expectedBuildSuffix}".`,
      );
    }

    selectedPackages[packageName] = {
      version: String(installedPackage.version || ''),
      build,
    };
  }

  return selectedPackages;
}

export async function inspectBlasInstallation(
  implementation,
  environmentName = TOOLS_ENVIRONMENT_NAME,
) {
  const packageSpec = createBlasPackageSpec(implementation);
  if (!packageSpec) {
    return {
      implementation,
      packageSpec,
      packages: {},
      validated: false,
    };
  }

  const result = await captureCommand('conda', [
    'list',
    '--name',
    environmentName,
    '--json',
  ]);
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect BLAS/LAPACK packages: ${result.stderr || result.stdout}`,
    );
  }

  let packages;
  try {
    packages = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Unable to parse installed BLAS/LAPACK packages: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }

  return {
    implementation,
    packageSpec,
    packages: validateBlasPackages(packages, implementation),
    validated: true,
  };
}
