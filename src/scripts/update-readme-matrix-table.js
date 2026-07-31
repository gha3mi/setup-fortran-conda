import fs from 'node:fs/promises';
import path from 'node:path';
import { isCommandNotFoundOutput } from '../lib/diagnostics.js';
import { requestGitHubJson } from '../lib/github.js';
import { replaceMarkedSection } from '../lib/markdown.js';
import { inferToolFromJobName, TOOL_ORDER } from '../lib/metadata.js';

const START_MARKER = '<!-- STATUS:setup-fortran-conda:START -->';
const END_MARKER = '<!-- STATUS:setup-fortran-conda:END -->';
const OPERATING_SYSTEM_ORDER = Object.freeze(['ubuntu', 'macos', 'windows']);
const STATUS_SYMBOLS = Object.freeze({
  success: '✅',
  failure: '❌',
  cancelled: '⛔',
  skipped: '⏭️',
});

function getStatusSymbol(job) {
  return STATUS_SYMBOLS[job?.conclusion] || '⏳';
}

function escapeTableCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function normalizeDisplayValue(value) {
  const normalized = escapeTableCell(value);
  if (!normalized) {
    return 'Unknown';
  }
  if (isCommandNotFoundOutput(normalized)) {
    return 'Not found';
  }

  return normalized.length > 48 ? `${normalized.slice(0, 45)}…` : normalized;
}

function inferTool(metadata, job) {
  return (
    metadata?.tool ||
    inferToolFromJobName(metadata?.job?.name || job?.name, {
      minimumParts: 2,
    })
  );
}

function formatOperatingSystem(metadata) {
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

async function readMetadataFiles(directory) {
  let files;
  try {
    files = await fs.readdir(directory);
  } catch {
    return [];
  }

  const metadata = [];
  for (const file of files.filter((name) => name.endsWith('.json'))) {
    try {
      const content = await fs.readFile(path.join(directory, file), 'utf8');
      metadata.push(JSON.parse(content));
    } catch {
      // Ignore incomplete metadata from cancelled jobs.
    }
  }

  return metadata;
}

function getUsedTools(metadataEntries, jobsById) {
  const usedTools = new Set();

  for (const metadata of metadataEntries) {
    const job = metadata?.job?.id ? jobsById.get(metadata.job.id) : null;
    const tool = inferTool(metadata, job);
    if (TOOL_ORDER.includes(tool)) {
      usedTools.add(tool);
    }
  }

  return TOOL_ORDER.filter((tool) => usedTools.has(tool));
}

function createRowKey(row, includeMpiColumns) {
  const values = [row.operatingSystem, row.compiler, row.compilerVersion];
  if (includeMpiColumns) {
    values.push(row.mpi, row.mpiVersion);
  }
  return values.join('||');
}

function createMatrix(metadataEntries, jobsById, tools) {
  const includeMpiColumns = metadataEntries.some(
    (metadata) => metadata?.mpi?.enabled === true,
  );
  const matrix = new Map();

  for (const metadata of metadataEntries) {
    const job = metadata?.job?.id ? jobsById.get(metadata.job.id) : null;
    const tool = inferTool(metadata, job);
    if (!tools.includes(tool)) {
      continue;
    }

    const compiler = escapeTableCell(metadata?.compiler?.requested || '');
    if (!compiler) {
      continue;
    }

    const mpiEnabled = metadata?.mpi?.enabled === true;
    const row = {
      operatingSystem: escapeTableCell(formatOperatingSystem(metadata)),
      compiler,
      compilerVersion: normalizeDisplayValue(
        metadata?.compiler?.actual_version,
      ),
      mpi: mpiEnabled
        ? escapeTableCell(
            metadata?.mpi?.implementation ||
              metadata?.mpi?.requested ||
              'Unknown',
          )
        : '',
      mpiVersion: mpiEnabled
        ? normalizeDisplayValue(metadata?.mpi?.actual_version)
        : '',
    };
    const key = createRowKey(row, includeMpiColumns);

    if (!matrix.has(key)) {
      for (const availableTool of tools) {
        row[availableTool] = '—';
      }
      matrix.set(key, row);
    }

    const toolVersion = normalizeDisplayValue(metadata?.tools?.[tool]?.version);
    matrix.get(key)[tool] = `${toolVersion} ${getStatusSymbol(job)}`;
  }

  return {
    includeMpiColumns,
    rows: Array.from(matrix.values()),
  };
}

function operatingSystemRank(value) {
  const family = String(value || '').split(' ')[0];
  const index = OPERATING_SYSTEM_ORDER.indexOf(family);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function compareRows(left, right) {
  const rankDifference =
    operatingSystemRank(left.operatingSystem) -
    operatingSystemRank(right.operatingSystem);
  if (rankDifference !== 0) {
    return rankDifference;
  }

  for (const field of [
    'operatingSystem',
    'compiler',
    'compilerVersion',
    'mpi',
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

function renderTable(rows, tools, includeMpiColumns) {
  const header = [
    'OS',
    'Compiler',
    'Version',
    ...(includeMpiColumns ? ['MPI', 'MPI Version'] : []),
    ...tools,
  ];
  const alignment = [
    '---',
    '---',
    '---:',
    ...(includeMpiColumns ? ['---', '---:'] : []),
    ...tools.map(() => ':---:'),
  ];
  const lines = [
    `| ${header.join(' | ')} |`,
    `|${alignment.map((value) => ` ${value} `).join('|')}|`,
  ];

  for (const row of rows) {
    const cells = [
      row.operatingSystem || '-',
      `\`${escapeTableCell(row.compiler)}\``,
      row.compilerVersion || 'Unknown',
      ...(includeMpiColumns
        ? [row.mpi ? `\`${escapeTableCell(row.mpi)}\`` : '', row.mpiVersion]
        : []),
      ...tools.map((tool) => row[tool] || '—'),
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }

  return lines.join('\n');
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN/GH_TOKEN');
  }
  if (!repository || !runId) {
    throw new Error('Missing GITHUB_REPOSITORY or GITHUB_RUN_ID');
  }

  const metadataDirectory =
    process.env.SETUP_FORTRAN_CONDA_META_DIR || '.setup-fortran-conda-meta';
  const readmePath = process.env.README_FILE || 'README.md';
  const metadataEntries = await readMetadataFiles(metadataDirectory);
  const response = await requestGitHubJson(
    `${apiUrl}/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`,
    token,
  );
  const jobs = Array.isArray(response.jobs) ? response.jobs : [];
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const tools = getUsedTools(metadataEntries, jobsById);
  const { rows, includeMpiColumns } = createMatrix(
    metadataEntries,
    jobsById,
    tools,
  );

  rows.sort(compareRows);
  await replaceMarkedSection({
    filePath: readmePath,
    startMarker: START_MARKER,
    endMarker: END_MARKER,
    content: renderTable(rows, tools, includeMpiColumns),
  });
  console.log('README updated with matrix table.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
