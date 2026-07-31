import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isCommandNotFoundOutput } from '../lib/diagnostics.js';
import { requestWorkflowJobs } from '../lib/github.js';
import { replaceMarkedSection } from '../lib/markdown.js';
import { inferToolFromJobName, TOOL_ORDER } from '../lib/metadata.js';
import {
  compareConfigurations,
  createConfiguration,
  readMetadataFiles,
} from '../lib/reporting.js';

const START_MARKER = '<!-- STATUS:setup-fortran-conda:START -->';
const END_MARKER = '<!-- STATUS:setup-fortran-conda:END -->';
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

function createRowKey(row, includeMpiColumns, includeBlasColumn) {
  const values = [row.operatingSystem, row.compiler, row.compilerVersion];
  if (includeMpiColumns) {
    values.push(row.mpi, row.mpiVersion);
  }
  if (includeBlasColumn) {
    values.push(row.blas);
  }
  return values.join('||');
}

export function createMatrix(metadataEntries, jobsById, tools) {
  const includeMpiColumns = metadataEntries.some(
    (metadata) => metadata?.mpi?.enabled === true,
  );
  const includeBlasColumn = metadataEntries.some(
    (metadata) => metadata?.blas?.enabled === true,
  );
  const matrix = new Map();

  for (const metadata of metadataEntries) {
    const job = metadata?.job?.id ? jobsById.get(metadata.job.id) : null;
    const tool = inferTool(metadata, job);
    if (!tools.includes(tool)) {
      continue;
    }

    const configuration = createConfiguration(metadata);
    const compiler = escapeTableCell(configuration.compiler);
    if (!compiler) {
      continue;
    }

    const row = {
      operatingSystem: escapeTableCell(configuration.operatingSystem),
      compiler,
      compilerVersion: normalizeDisplayValue(configuration.compilerVersion),
      mpi: escapeTableCell(configuration.mpi),
      mpiVersion: configuration.mpi
        ? normalizeDisplayValue(configuration.mpiVersion)
        : '',
      blas: escapeTableCell(configuration.blas),
    };
    const key = createRowKey(row, includeMpiColumns, includeBlasColumn);

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
    includeBlasColumn,
    rows: Array.from(matrix.values()),
  };
}

export function renderTable(rows, tools, includeMpiColumns, includeBlasColumn) {
  const header = [
    'OS',
    'Compiler',
    'Version',
    ...(includeMpiColumns ? ['MPI', 'MPI Version'] : []),
    ...(includeBlasColumn ? ['BLAS/LAPACK'] : []),
    ...tools,
  ];
  const alignment = [
    '---',
    '---',
    '---:',
    ...(includeMpiColumns ? ['---', '---:'] : []),
    ...(includeBlasColumn ? ['---'] : []),
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
      ...(includeBlasColumn
        ? [row.blas ? `\`${escapeTableCell(row.blas)}\`` : '']
        : []),
      ...tools.map((tool) => row[tool] || '—'),
    ];
    lines.push(`| ${cells.join(' | ')} |`);
  }

  return lines.join('\n');
}

export async function main() {
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
  const jobs = await requestWorkflowJobs({
    apiUrl,
    repository,
    runId,
    token,
  });
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const tools = getUsedTools(metadataEntries, jobsById);
  const { rows, includeMpiColumns, includeBlasColumn } = createMatrix(
    metadataEntries,
    jobsById,
    tools,
  );

  rows.sort(compareConfigurations);
  await replaceMarkedSection({
    filePath: readmePath,
    startMarker: START_MARKER,
    endMarker: END_MARKER,
    content: renderTable(rows, tools, includeMpiColumns, includeBlasColumn),
  });
  console.log('README updated with matrix table.');
}

const entryPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : '';
if (entryPath === import.meta.url) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
