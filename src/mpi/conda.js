import { info } from '@actions/core';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCondaPackageSpec } from '../compilers/common.js';
import {
  addMpiPaths,
  createHostedRunnerUcxEnvironment,
  createMpiDescriptor,
  getCondaPackageVersion,
  getCondaPrefix,
  installMpiPackages,
} from './common.js';

function findFiles(root, predicate, depth = 0) {
  if (!existsSync(root) || depth > 3) {
    return [];
  }

  const matches = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const filePath = join(root, entry.name);
    if (entry.isDirectory()) {
      matches.push(...findFiles(filePath, predicate, depth + 1));
    } else if (entry.isFile() && predicate(entry.name)) {
      matches.push(filePath);
    }
  }
  return matches;
}

function rewriteFileIfChanged(filePath, transform) {
  const content = readFileSync(filePath, 'utf8');
  const updated = transform(content);
  if (updated === content) {
    return false;
  }

  writeFileSync(filePath, updated);
  return true;
}

function findMacOsMpiMetadataFiles(condaPrefix, implementation) {
  if (implementation === 'openmpi') {
    return [
      ...findFiles(join(condaPrefix, 'share', 'openmpi'), (name) =>
        name.endsWith('-wrapper-data.txt'),
      ),
      ...findFiles(
        join(condaPrefix, 'lib', 'pkgconfig'),
        (name) => name.startsWith('ompi') && name.endsWith('.pc'),
      ),
    ];
  }

  const mpichWrapper =
    /^(?:mpic\+\+|mpicc(?:_abi)?|mpicxx(?:_abi)?|mpif77|mpif90|mpifort)$/;
  return [
    ...findFiles(join(condaPrefix, 'bin'), (name) => mpichWrapper.test(name)),
    ...findFiles(
      join(condaPrefix, 'lib', 'pkgconfig'),
      (name) => name === 'mpich.pc',
    ),
  ];
}

function normalizeMacOsMpiRpaths(condaPrefix, implementation) {
  // The compiler setup keeps one conda runtime RPATH. Remove the duplicate
  // copies embedded in the MPI wrappers and pkg-config metadata.
  const metadataFiles = findMacOsMpiMetadataFiles(condaPrefix, implementation);

  let changedFileCount = 0;
  for (const filePath of metadataFiles) {
    if (
      rewriteFileIfChanged(filePath, (content) =>
        content
          .replace(/[ \t]+-Wl,-rpath,[^ \t"'\\\r\n]+/g, '')
          .replace(/[ \t]+-R[^ \t"'\\\r\n]+/g, ''),
      )
    ) {
      changedFileCount += 1;
    }
  }

  info(
    `Normalized macOS ${implementation} RPATH metadata in ` +
      `${changedFileCount} files`,
  );
}

export async function setupCondaMpi({
  implementation,
  mpiVersion,
  compilerVersion,
  operatingSystem,
}) {
  const packages = [
    createCondaPackageSpec('gfortran', compilerVersion),
    createCondaPackageSpec(implementation, mpiVersion),
  ];

  await installMpiPackages(packages, ['conda-forge']);

  const condaPrefix = await getCondaPrefix();
  addMpiPaths(condaPrefix, operatingSystem);
  if (operatingSystem === 'macos') {
    normalizeMacOsMpiRpaths(condaPrefix, implementation);
  }

  const actualVersion = await getCondaPackageVersion(implementation);
  info(`Configured ${implementation} ${actualVersion} from Conda`);

  return createMpiDescriptor({
    implementation,
    version: actualVersion,
    root: condaPrefix,
    wrapperProbeArgs:
      implementation === 'openmpi' ? ['--showme:command'] : ['-show'],
    versionProbe:
      implementation === 'openmpi'
        ? { command: 'mpirun', args: ['--version'] }
        : { command: 'mpiexec', args: ['--version'] },
    expectedFortranCompiler: 'gfortran',
    environment: createHostedRunnerUcxEnvironment(operatingSystem),
  });
}
