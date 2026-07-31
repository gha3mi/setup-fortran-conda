import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestWorkflowJobs } from '../../src/lib/github.js';
import {
  compareConfigurations,
  configurationRank,
  createConfiguration,
} from '../../src/lib/reporting.js';
import { createStatusEntry } from '../../src/scripts/generate-status.js';
import {
  createMatrix,
  renderTable,
} from '../../src/scripts/update-readme-matrix-table.js';

function createMetadata({
  id,
  tool = 'fpm',
  compiler = 'gfortran',
  mpi = '',
  blas = '',
}) {
  return {
    schema_version: 3,
    job: {
      id,
      name: `ubuntu-latest_${compiler}${mpi ? `_${mpi}` : ''}${blas ? `_${blas}` : ''}_${tool}`,
    },
    runner: {
      os_family: 'ubuntu',
      os_version: '24.04',
      os_label: 'ubuntu 24.04',
    },
    compiler: {
      enabled: true,
      requested: compiler,
      actual_version: '16.1.0',
    },
    mpi: {
      enabled: Boolean(mpi),
      requested: mpi || 'none',
      implementation: mpi || 'none',
      actual_version: mpi ? '5.0.1' : '',
    },
    blas: {
      enabled: Boolean(blas),
      requested: blas || 'none',
      implementation: blas || 'none',
      validated: Boolean(blas),
    },
    tool,
    tools: {
      [tool]: { version: '1.0.0' },
    },
  };
}

test('workflow job retrieval includes every API page', async () => {
  const allJobs = Array.from({ length: 205 }, (_, index) => ({
    id: index + 1,
  }));
  const requestedPages = [];

  const jobs = await requestWorkflowJobs({
    repository: 'owner/repository',
    runId: 42,
    token: 'token',
    request: async (url) => {
      const page = Number(new URL(url).searchParams.get('page'));
      requestedPages.push(page);
      const offset = (page - 1) * 100;
      return {
        total_count: allJobs.length,
        jobs: allJobs.slice(offset, offset + 100),
      };
    },
  });

  assert.equal(jobs.length, 205);
  assert.deepEqual(requestedPages, [1, 2, 3]);
});

test('configuration sorting uses the four global toolchain groups', () => {
  const configurations = [
    createConfiguration(createMetadata({ id: 4, blas: 'openblas' })),
    createConfiguration(createMetadata({ id: 3, mpi: 'openmpi' })),
    createConfiguration(
      createMetadata({ id: 2, mpi: 'openmpi', blas: 'openblas' }),
    ),
    createConfiguration(createMetadata({ id: 1 })),
  ];

  configurations.sort(compareConfigurations);
  assert.deepEqual(configurations.map(configurationRank), [0, 1, 2, 3]);
});

test('README matrix adds BLAS only when BLAS metadata is present', () => {
  const metadataEntries = [
    createMetadata({ id: 1 }),
    createMetadata({ id: 2, mpi: 'openmpi', blas: 'openblas' }),
    createMetadata({ id: 3, mpi: 'openmpi' }),
    createMetadata({ id: 4, blas: 'openblas' }),
  ];
  const jobsById = new Map(
    metadataEntries.map((metadata) => [
      metadata.job.id,
      { id: metadata.job.id, conclusion: 'success' },
    ]),
  );

  const matrix = createMatrix(metadataEntries, jobsById, ['fpm']);
  matrix.rows.sort(compareConfigurations);

  assert.equal(matrix.includeMpiColumns, true);
  assert.equal(matrix.includeBlasColumn, true);
  assert.deepEqual(matrix.rows.map(configurationRank), [0, 1, 2, 3]);

  const table = renderTable(
    matrix.rows,
    ['fpm'],
    matrix.includeMpiColumns,
    matrix.includeBlasColumn,
  );
  assert.match(table, /MPI Version \| BLAS\/LAPACK \| fpm/);
  assert.match(table, /`openmpi` \| 5\.0\.1 \| `openblas`/);

  const compilerOnly = createMatrix(
    [createMetadata({ id: 5 })],
    new Map([[5, { id: 5, conclusion: 'success' }]]),
    ['fpm'],
  );
  assert.equal(compilerOnly.includeBlasColumn, false);
  assert.doesNotMatch(
    renderTable(
      compilerOnly.rows,
      ['fpm'],
      compilerOnly.includeMpiColumns,
      compilerOnly.includeBlasColumn,
    ),
    /BLAS\/LAPACK/,
  );
});

test('status badges include MPI and BLAS metadata', () => {
  const metadata = createMetadata({
    id: 1,
    mpi: 'openmpi',
    blas: 'openblas',
  });
  const entry = createStatusEntry(
    { name: metadata.job.name, conclusion: 'success' },
    metadata,
    'fpm',
  );

  assert.match(entry.markdown, /openmpi/);
  assert.match(entry.markdown, /openblas/);
  assert.match(entry.markdown, /passing-brightgreen/);
});
