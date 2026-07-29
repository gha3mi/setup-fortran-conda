import { info } from '@actions/core';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addCondaPaths,
  createMpiDescriptor,
  getCondaPackageVersion,
  getCondaPrefix,
  hostedRunnerUcxEnvironment,
  installCondaPackages,
} from './common.js';

function filesNamed(root, predicate, depth = 0) {
  if (!existsSync(root) || depth > 3) return [];

  const matches = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      matches.push(...filesNamed(path, predicate, depth + 1));
    } else if (entry.isFile() && predicate(entry.name)) {
      matches.push(path);
    }
  }
  return matches;
}

function rewriteFile(path, transform) {
  const content = readFileSync(path, 'utf8');
  const updated = transform(content);
  if (updated === content) return false;

  writeFileSync(path, updated);
  return true;
}

function macOsMpiMetadata(prefix, implementation) {
  if (implementation === 'openmpi') {
    return [
      ...filesNamed(
        join(prefix, 'share', 'openmpi'),
        (name) => name.endsWith('-wrapper-data.txt')
      ),
      ...filesNamed(
        join(prefix, 'lib', 'pkgconfig'),
        (name) => name.startsWith('ompi') && name.endsWith('.pc')
      ),
    ];
  }

  const mpichWrapper =
    /^(?:mpic\+\+|mpicc(?:_abi)?|mpicxx(?:_abi)?|mpif77|mpif90|mpifort)$/;
  return [
    ...filesNamed(join(prefix, 'bin'), (name) => mpichWrapper.test(name)),
    ...filesNamed(
      join(prefix, 'lib', 'pkgconfig'),
      (name) => name === 'mpich.pc'
    ),
  ];
}

function normalizeMacOsMpiRpaths(prefix, implementation) {
  // The compiler setup keeps one conda runtime RPATH. Remove the duplicate
  // copies embedded in the MPI wrappers and pkg-config metadata.
  const mpiMetadata = macOsMpiMetadata(prefix, implementation);

  let changed = 0;
  for (const path of mpiMetadata) {
    if (
      rewriteFile(path, (content) =>
        content
          .replace(/[ \t]+-Wl,-rpath,[^ \t"'\\\r\n]+/g, '')
          .replace(/[ \t]+-R[^ \t"'\\\r\n]+/g, '')
      )
    ) {
      changed += 1;
    }
  }

  info(`Normalized macOS ${implementation} RPATH metadata in ${changed} files`);
}

export async function setupCondaMpi({
  implementation,
  mpiVersion,
  compilerVersion,
  osKey,
}) {
  const packages = [
    compilerVersion ? `gfortran=${compilerVersion}` : 'gfortran',
    mpiVersion ? `${implementation}=${mpiVersion}` : implementation,
  ];

  await installCondaPackages(packages, ['conda-forge']);

  const prefix = await getCondaPrefix();
  addCondaPaths(prefix, osKey);
  if (osKey === 'mac') {
    normalizeMacOsMpiRpaths(prefix, implementation);
  }

  const actualVersion = await getCondaPackageVersion(implementation);
  info(`Configured ${implementation} ${actualVersion} from Conda`);

  return createMpiDescriptor({
    implementation,
    version: actualVersion,
    root: prefix,
    wrapperProbeArgs:
      implementation === 'openmpi' ? ['--showme:command'] : ['-show'],
    versionProbe:
      implementation === 'openmpi'
        ? { command: 'mpirun', args: ['--version'] }
        : { command: 'mpiexec', args: ['--version'] },
    expectedFortranCompiler: 'gfortran',
    environment: hostedRunnerUcxEnvironment(osKey),
  });
}
