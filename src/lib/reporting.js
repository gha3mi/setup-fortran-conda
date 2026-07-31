import fs from 'node:fs/promises';
import path from 'node:path';

const OPERATING_SYSTEM_ORDER = Object.freeze(['ubuntu', 'macos', 'windows']);

export async function readMetadataFiles(directory) {
  let files;
  try {
    files = await fs.readdir(directory);
  } catch {
    return [];
  }

  const metadataEntries = [];
  for (const file of files.filter((name) => name.endsWith('.json'))) {
    try {
      const content = await fs.readFile(path.join(directory, file), 'utf8');
      metadataEntries.push(JSON.parse(content));
    } catch {
      // Cancelled jobs may leave incomplete metadata artifacts.
    }
  }

  return metadataEntries;
}

export function formatOperatingSystem(metadata) {
  const family = String(metadata?.runner?.os_family || '').toLowerCase();
  const version = metadata?.runner?.os_version || '';
  const label = metadata?.runner?.os_label || '';

  if (family === 'ubuntu' && version) {
    return `ubuntu ${version.split('.').slice(0, 2).join('.')}`;
  }

  if (family === 'macos' && version) {
    return `macos ${version.split('.')[0]}`;
  }

  if (family === 'windows') {
    const year = label.match(/(20\d{2})/)?.[1];
    return year ? `windows ${year}` : 'windows';
  }

  if (family && version) {
    return `${family} ${version}`;
  }
  if (family) {
    return family;
  }

  return String(metadata?.runner?.os || 'unknown').toLowerCase();
}

export function createConfiguration(metadata) {
  const compilerEnabled = metadata?.compiler?.enabled !== false;
  const mpiEnabled = metadata?.mpi?.enabled === true;
  const blasEnabled = metadata?.blas?.enabled === true;

  return {
    operatingSystem: formatOperatingSystem(metadata),
    compiler: compilerEnabled ? metadata?.compiler?.requested || '' : '',
    compilerVersion: compilerEnabled
      ? metadata?.compiler?.actual_version || ''
      : '',
    mpi: mpiEnabled
      ? metadata?.mpi?.implementation || metadata?.mpi?.requested || ''
      : '',
    mpiVersion: mpiEnabled ? metadata?.mpi?.actual_version || '' : '',
    blas: blasEnabled
      ? metadata?.blas?.implementation || metadata?.blas?.requested || ''
      : '',
  };
}

export function configurationRank(configuration) {
  const hasMpi = Boolean(configuration.mpi);
  const hasBlas = Boolean(configuration.blas);

  if (!hasMpi && !hasBlas) {
    return 0;
  }
  if (hasMpi && hasBlas) {
    return 1;
  }
  if (hasMpi) {
    return 2;
  }
  return 3;
}

function operatingSystemRank(value) {
  const family = String(value || '').split(' ')[0];
  const index = OPERATING_SYSTEM_ORDER.indexOf(family);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function compareConfigurations(left, right) {
  const categoryDifference = configurationRank(left) - configurationRank(right);
  if (categoryDifference !== 0) {
    return categoryDifference;
  }

  const operatingSystemDifference =
    operatingSystemRank(left.operatingSystem) -
    operatingSystemRank(right.operatingSystem);
  if (operatingSystemDifference !== 0) {
    return operatingSystemDifference;
  }

  for (const field of [
    'operatingSystem',
    'compiler',
    'compilerVersion',
    'mpi',
    'mpiVersion',
    'blas',
  ]) {
    const comparison = String(left[field] || '').localeCompare(
      String(right[field] || ''),
      undefined,
      { numeric: true },
    );
    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0;
}
