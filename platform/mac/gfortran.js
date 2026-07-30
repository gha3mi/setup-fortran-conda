import { info } from '@actions/core';
import { exec as run } from '@actions/exec';
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertMacOs,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportProcessEnvironment,
  getCondaPrefix,
  grouped,
  installCondaPackages,
  setMacOsSdkRoot,
  showCondaEnvironment,
  verifyCommands,
} from './common.js';

async function detectHomebrewGcc() {
  let prefix = '';
  await run('brew', ['--prefix'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        prefix += data.toString();
      },
    },
  });

  const bin = join(prefix.trim(), 'bin');
  if (!existsSync(bin)) {
    throw new Error(`Homebrew bin directory not found: ${bin}`);
  }

  const versions = readdirSync(bin)
    .filter((name) => name.startsWith('gcc-'))
    .map((name) => Number.parseInt(name.replace('gcc-', ''), 10))
    .filter(Number.isFinite);
  if (!versions.length) {
    throw new Error(`No versioned Homebrew gcc executable found in ${bin}`);
  }
  return `gcc-${Math.max(...versions)}`;
}

function filesNamed(root, name, depth = 0) {
  if (!existsSync(root) || depth > 3) return [];

  const matches = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      matches.push(...filesNamed(path, name, depth + 1));
    } else if (entry.isFile() && entry.name === name) {
      matches.push(path);
    }
  }
  return matches;
}

function configureCondaGfortranRpath(prefix) {
  const libraryPath = join(prefix, 'lib');
  let changed = 0;

  for (const path of filesNamed(join(prefix, 'lib', 'gcc'), 'specs')) {
    const content = readFileSync(path, 'utf8');
    const updated = content.replace(
      /(\*darwin_rpaths:\r?\n)[^\r\n]*/,
      (_, header) => `${header}%{!static:-rpath ${libraryPath}}`
    );
    if (updated === content) continue;

    writeFileSync(path, updated);
    changed += 1;
  }

  info(`Configured macOS gfortran RPATH in ${changed} GCC specs file(s)`);
}

async function installHomebrewGcc(version) {
  return grouped('setup-fortran-conda: Install Homebrew GCC', async () => {
    try {
      if (version) {
        const major = version.split('.')[0];
        await run('brew', ['install', `gcc@${major}`], { silent: true });
        info(`Homebrew gcc@${major} installed`);
        return { c: `gcc-${major}`, cxx: `g++-${major}` };
      }

      await run('brew', ['install', 'gcc'], { silent: true });
      info('Homebrew latest gcc installed');
      const c = await detectHomebrewGcc();
      return { c, cxx: c.replace('gcc', 'g++') };
    } catch (error) {
      throw new Error(`Homebrew gcc install failed: ${error.message}`);
    }
  });
}

export async function setup(version = '') {
  assertMacOs();

  const { c, cxx } = await installHomebrewGcc(version);
  await installCondaPackages([
    version ? `gfortran=${version}` : 'gfortran',
    'binutils',
  ]);
  await showCondaEnvironment();

  const prefix = await getCondaPrefix();
  configureCondaGfortranRpath(prefix);
  await addExistingPaths([join(prefix, 'bin')], { log: false });
  await setMacOsSdkRoot();

  await verifyCommands([
    { command: 'gfortran', args: ['--version'] },
    { command: c, args: ['--version'] },
    { command: cxx, args: ['--version'] },
  ]);
  await exportCompilerEnvironment(
    compilerEnvironment('gfortran', c, cxx)
  );
  await exportProcessEnvironment({ warningPrefix: '' });

  info('✅ compiler setup complete');
}
