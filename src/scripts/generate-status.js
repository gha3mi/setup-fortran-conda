import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { requestWorkflowJobs } from '../lib/github.js';
import { inferToolFromJobName, TOOL_ORDER } from '../lib/metadata.js';
import {
  compareConfigurations,
  createConfiguration,
  readMetadataFiles,
} from '../lib/reporting.js';

const STATUS_STYLES = Object.freeze({
  success: { label: 'passing', color: 'brightgreen' },
  failure: { label: 'failing', color: 'red' },
  cancelled: { label: 'cancelled', color: 'lightgrey' },
  skipped: { label: 'skipped', color: 'lightgrey' },
});

function badgeComponent(value) {
  return String(value)
    .replace(/-/g, '--')
    .replace(/_/g, '__')
    .replace(/\s+/g, '_');
}

function fallbackKey(jobName, tool) {
  return String(jobName || '')
    .replace(new RegExp(`_${tool}$`), '')
    .trim();
}

export function createStatusEntry(job, metadata, tool) {
  const configuration = metadata ? createConfiguration(metadata) : null;
  const configurationParts = configuration
    ? [
        configuration.operatingSystem,
        configuration.compiler,
        configuration.mpi,
        configuration.blas,
      ].filter(Boolean)
    : [];
  const key =
    configurationParts.join('_') || fallbackKey(job?.name || '', tool);
  const style = STATUS_STYLES[job?.conclusion] || {
    label: 'pending',
    color: 'lightgrey',
  };

  return {
    configuration,
    jobName: job?.name || '',
    markdown:
      `![${key}](https://img.shields.io/badge/` +
      `${badgeComponent(key)}-${style.label}-${style.color})`,
  };
}

export async function generateStatus({
  tool,
  token,
  repository,
  runId,
  apiUrl = 'https://api.github.com',
  metadataDirectory,
  outputDirectory = `status-${tool}`,
}) {
  if (!TOOL_ORDER.includes(tool)) {
    throw new Error(`Unsupported status tool: ${tool}`);
  }
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN/GH_TOKEN');
  }
  if (!repository || !runId) {
    throw new Error('Missing GITHUB_REPOSITORY or GITHUB_RUN_ID');
  }

  const [jobs, metadataEntries] = await Promise.all([
    requestWorkflowJobs({ apiUrl, repository, runId, token }),
    readMetadataFiles(metadataDirectory),
  ]);
  const metadataByJobId = new Map(
    metadataEntries
      .filter((metadata) => metadata?.job?.id)
      .map((metadata) => [metadata.job.id, metadata]),
  );
  const entries = jobs
    .filter(
      (job) => inferToolFromJobName(job?.name, { minimumParts: 2 }) === tool,
    )
    .map((job) => createStatusEntry(job, metadataByJobId.get(job.id), tool));

  entries.sort((left, right) => {
    if (left.configuration && right.configuration) {
      const comparison = compareConfigurations(
        left.configuration,
        right.configuration,
      );
      if (comparison !== 0) {
        return comparison;
      }
    } else if (left.configuration) {
      return -1;
    } else if (right.configuration) {
      return 1;
    }

    return left.jobName.localeCompare(right.jobName, undefined, {
      numeric: true,
    });
  });

  await fs.mkdir(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, 'STATUS.md');
  await fs.writeFile(
    outputPath,
    `${entries.map((entry) => entry.markdown).join(' ')}\n`,
    'utf8',
  );
  return outputPath;
}

async function main() {
  const tool = process.argv[2] || '';
  const outputPath = await generateStatus({
    tool,
    token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
    repository: process.env.GITHUB_REPOSITORY || process.env.REPO,
    runId: process.env.GITHUB_RUN_ID || process.env.RUN_ID,
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    metadataDirectory:
      process.env.SETUP_FORTRAN_CONDA_META_DIR || '.setup-fortran-conda-meta',
  });
  console.log(await fs.readFile(outputPath, 'utf8'));
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
