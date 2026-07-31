import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test } from 'node:test';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const UNBUNDLED_SCRIPTS = Object.freeze([
  'src/scripts/update-readme-fpm-deps.js',
  'src/scripts/update-readme-fpm-modules.js',
  'src/scripts/update-readme-matrix-table.js',
]);
const STATIC_IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*['"]([^'"]+)['"]/g;

function findImportSpecifiers(source) {
  const specifiers = [];
  for (const pattern of [STATIC_IMPORT_PATTERN, DYNAMIC_IMPORT_PATTERN]) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

async function findExternalImports(entryPath) {
  const externalImports = new Set();
  const pending = [entryPath];
  const visited = new Set();

  while (pending.length > 0) {
    const filePath = pending.pop();
    if (visited.has(filePath)) {
      continue;
    }
    visited.add(filePath);

    const source = await fs.readFile(filePath, 'utf8');
    for (const specifier of findImportSpecifiers(source)) {
      if (specifier.startsWith('node:')) {
        continue;
      }
      if (specifier.startsWith('.')) {
        pending.push(path.resolve(path.dirname(filePath), specifier));
        continue;
      }
      externalImports.add(specifier);
    }
  }

  return [...externalImports].sort();
}

test('unbundled action scripts use only Node.js and repository modules', async () => {
  for (const relativePath of UNBUNDLED_SCRIPTS) {
    const externalImports = await findExternalImports(
      path.join(REPOSITORY_ROOT, relativePath),
    );
    assert.deepEqual(
      externalImports,
      [],
      `${relativePath} imports packages unavailable to action consumers`,
    );
  }
});
