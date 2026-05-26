import fs from 'node:fs/promises';
import fssync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = 'https://github.com/davidpfister/fpm-modules';
const START = '<!-- FPM-MODULES:setup-fortran-conda:START -->';
const END = '<!-- FPM-MODULES:setup-fortran-conda:END -->';

function fail(message) {
  throw new Error(message);
}

function run(cmd, args, options = {}) {
  const display = [cmd, ...args].join(' ');
  console.log(`$ ${display}`);
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.error) {
    fail(`${display} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${display} exited with status ${result.status}`);
  }
}

function splitArgs(input, label) {
  const text = String(input || '').trim();
  if (!text) return [];

  const args = [];
  let current = '';
  let quote = '';
  let escaping = false;
  let inToken = false;

  for (const ch of text) {
    if (escaping) {
      current += ch;
      escaping = false;
      inToken = true;
      continue;
    }

    if (ch === '\\' && quote !== "'") {
      escaping = true;
      inToken = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = '';
      } else {
        current += ch;
      }
      inToken = true;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
      continue;
    }

    if (/\s/.test(ch)) {
      if (inToken) {
        args.push(current);
        current = '';
        inToken = false;
      }
      continue;
    }

    current += ch;
    inToken = true;
  }

  if (escaping) {
    current += '\\';
  }
  if (quote) {
    fail(`Unclosed quote in ${label}.`);
  }
  if (inToken) {
    args.push(current);
  }

  return args;
}

function cleanMermaid(text) {
  let out = String(text || '').trim();
  out = out.replace(/^```(?:mermaid|mmd)?\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!out) fail('fpm-modules produced an empty Mermaid file.');
  return out;
}

async function installFpmModules(installPrefix) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'setup-fortran-conda-fpm-modules-'));
  const sourceDir = path.join(tempRoot, 'fpm-modules');

  run('git', ['clone', '--depth', '1', REPO, sourceDir]);
  run('fpm', ['install', '--profile', 'release', '--prefix', installPrefix], { cwd: sourceDir });

  const binDir = path.join(installPrefix, 'bin');
  process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;
}

function runFpmModules(workingDirectory, outputFile) {
  const userArgs = splitArgs(process.env.DEPENDENCY_GRAPH_OPTIONS || '', 'dependency-graph-options');
  const args = ['modules', ...userArgs, '-d', workingDirectory, '-K', 'mermaid', '-o', outputFile];
  run('fpm', args);
}

async function injectReadme(readmePath, diagram) {
  const readme = await fs.readFile(readmePath, 'utf8');
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`README markers not found for fpm-modules. Add:\n${START}\n${END}`);
  }

  const body = ['```mermaid', diagram, '```'].join('\n');

  const before = readme.slice(0, startIdx + START.length);
  const after = readme.slice(endIdx);
  await fs.writeFile(readmePath, `${before}\n\n${body}\n\n${after}`, 'utf8');
}

async function main() {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const workingDirectory = path.resolve(workspace, process.env.DEPENDENCY_GRAPH_WORKING_DIRECTORY || '.');
  const readmePath = path.resolve(workspace, process.env.DEPENDENCY_GRAPH_README_FILE || 'README.md');
  const installPrefix = path.resolve(os.homedir(), '.local');
  const outputFile = path.join(os.tmpdir(), `setup-fortran-conda-fpm-modules-${Date.now()}.mmd`);

  if (process.platform !== 'linux') {
    fail('README fpm-modules graph generation is currently supported only on Linux runners.');
  }
  if (!fssync.existsSync(path.join(workingDirectory, 'fpm.toml'))) {
    fail(`No fpm.toml found in dependency graph working directory: ${workingDirectory}`);
  }

  await installFpmModules(installPrefix);
  runFpmModules(workingDirectory, outputFile);

  const diagram = cleanMermaid(await fs.readFile(outputFile, 'utf8'));
  await injectReadme(readmePath, diagram);
  console.log('README updated with fpm-modules dependency graph.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
