import { normalizeRequestedVersion } from './version.js';

export function readActionInputs(environment = process.env) {
  const rawMpiVersion = String(environment.INPUT_MPI_VERSION || '').trim();

  return {
    compiler: String(environment.INPUT_COMPILER || '').toLowerCase(),
    compilerVersion: normalizeRequestedVersion(
      environment.INPUT_COMPILER_VERSION,
    ),
    platform: String(environment.INPUT_PLATFORM || '').toLowerCase(),
    extraPackages: String(environment.INPUT_EXTRA_PACKAGES || '')
      .split(/[\s,]+/)
      .map((packageName) => packageName.trim())
      .filter(Boolean),
    fpmVersion: environment.INPUT_FPM_VERSION || '',
    mpi:
      String(environment.INPUT_MPI || 'none')
        .trim()
        .toLowerCase() || 'none',
    mpiVersion: normalizeRequestedVersion(rawMpiVersion),
    rawMpiVersion,
  };
}

export function resolveOperatingSystem(platformInput) {
  if (platformInput.includes('ubuntu') || platformInput.includes('linux')) {
    return 'linux';
  }
  if (platformInput.includes('windows')) {
    return 'windows';
  }
  if (platformInput.includes('macos')) {
    return 'macos';
  }

  throw new Error(`Unsupported platform: ${platformInput}`);
}
