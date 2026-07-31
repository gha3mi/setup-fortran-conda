import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { replaceMarkedSection } from '../lib/markdown.js';

const TOOLS = Object.freeze({
  'fpm-deps': Object.freeze({
    repository: 'https://github.com/ivan-pi/fpm-deps',
    startMarker: '<!-- FPM-DEPS:setup-fortran-conda:START -->',
    endMarker: '<!-- FPM-DEPS:setup-fortran-conda:END -->',
    run({ userArguments, workingDirectory, outputFile }) {
      runCommand(
        'fpm-deps',
        [...userArguments, '--mermaid', '-o', outputFile],
        { cwd: workingDirectory },
      );
    },
    successMessage: 'README updated with fpm-deps dependency graph.',
  }),
  'fpm-modules': Object.freeze({
    repository: 'https://github.com/davidpfister/fpm-modules',
    startMarker: '<!-- FPM-MODULES:setup-fortran-conda:START -->',
    endMarker: '<!-- FPM-MODULES:setup-fortran-conda:END -->',
    run({ userArguments, workingDirectory, outputFile }) {
      runCommand('fpm', [
        'modules',
        ...userArguments,
        '-d',
        workingDirectory,
        '-K',
        'mermaid',
        '-o',
        outputFile,
      ]);
    },
    successMessage: 'README updated with fpm-modules dependency graph.',
  }),
});

function runCommand(command, args, options = {}) {
  const displayCommand = [command, ...args].join(' ');
  console.log(`$ ${displayCommand}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  if (result.error) {
    throw new Error(`${displayCommand} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${displayCommand} exited with status ${result.status}`);
  }
}

export function parseCommandArguments(input, label) {
  const text = String(input || '').trim();
  if (!text) {
    return [];
  }

  const args = [];
  let current = '';
  let quote = '';
  let escaping = false;
  let inToken = false;

  for (const character of text) {
    if (escaping) {
      current += character;
      escaping = false;
      inToken = true;
      continue;
    }

    if (character === '\\' && quote !== "'") {
      escaping = true;
      inToken = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = '';
      } else {
        current += character;
      }
      inToken = true;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      inToken = true;
      continue;
    }

    if (/\s/.test(character)) {
      if (inToken) {
        args.push(current);
        current = '';
        inToken = false;
      }
      continue;
    }

    current += character;
    inToken = true;
  }

  if (escaping) {
    current += '\\';
  }
  if (quote) {
    throw new Error(`Unclosed quote in ${label}.`);
  }
  if (inToken) {
    args.push(current);
  }

  return args;
}

function normalizeMermaid(text, toolName) {
  const diagram = String(text || '')
    .trim()
    .replace(/^```(?:mermaid|mmd)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  if (!diagram) {
    throw new Error(`${toolName} produced an empty Mermaid file.`);
  }
  return diagram;
}

async function installTool(toolName, repository, temporaryDirectory) {
  const sourceDirectory = path.join(temporaryDirectory, toolName);
  const installPrefix = path.resolve(os.homedir(), '.local');

  runCommand('git', ['clone', '--depth', '1', repository, sourceDirectory]);
  runCommand(
    'fpm',
    ['install', '--profile', 'release', '--prefix', installPrefix],
    { cwd: sourceDirectory },
  );

  const binDirectory = path.join(installPrefix, 'bin');
  process.env.PATH = [binDirectory, process.env.PATH || ''].join(
    path.delimiter,
  );
}

async function updateReadmeDependencyGraph(toolName) {
  const tool = TOOLS[toolName];
  if (!tool) {
    throw new Error(`Unsupported dependency graph tool: ${toolName}`);
  }
  if (process.platform !== 'linux') {
    throw new Error(
      `README ${toolName} graph generation is currently ` +
        'supported only on Linux runners.',
    );
  }

  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const workingDirectory = path.resolve(
    workspace,
    process.env.DEPENDENCY_GRAPH_WORKING_DIRECTORY || '.',
  );
  const readmePath = path.resolve(
    workspace,
    process.env.DEPENDENCY_GRAPH_README_FILE || 'README.md',
  );

  if (!existsSync(path.join(workingDirectory, 'fpm.toml'))) {
    throw new Error(
      `No fpm.toml found in dependency graph working directory: ${
        workingDirectory
      }`,
    );
  }

  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), `setup-fortran-conda-${toolName}-`),
  );

  try {
    await installTool(toolName, tool.repository, temporaryDirectory);

    const outputFile = path.join(temporaryDirectory, 'graph.mmd');
    const userArguments = parseCommandArguments(
      process.env.DEPENDENCY_GRAPH_OPTIONS,
      'dependency-graph-options',
    );
    tool.run({
      userArguments,
      workingDirectory,
      outputFile,
    });

    const diagram = normalizeMermaid(
      await fs.readFile(outputFile, 'utf8'),
      toolName,
    );
    await replaceMarkedSection({
      filePath: readmePath,
      startMarker: tool.startMarker,
      endMarker: tool.endMarker,
      content: ['```mermaid', diagram, '```'].join('\n'),
    });
    console.log(tool.successMessage);
  } finally {
    await fs.rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
}

export function runDependencyGraphScript(toolName) {
  updateReadmeDependencyGraph(toolName).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
