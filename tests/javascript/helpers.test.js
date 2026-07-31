import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { isCommandNotFoundOutput } from '../../src/lib/diagnostics.js';
import { prependPathEntries } from '../../src/lib/environment.js';
import { getErrorMessage } from '../../src/lib/errors.js';
import { isTransientGitHubRequestError } from '../../src/lib/github.js';
import { HttpResponseError, retryOperation } from '../../src/lib/http.js';
import { replaceMarkedSection } from '../../src/lib/markdown.js';
import { inferToolFromJobName } from '../../src/lib/metadata.js';
import {
  compareNumericVersions,
  firstLine,
  firstVersion,
  normalizeRequestedVersion,
} from '../../src/lib/version.js';
import { normalizeCommandName } from '../../src/mpi/common.js';
import {
  extractHpcxVersionFromPath,
  extractOpenMpiPrefix,
} from '../../src/mpi/hpcx.js';
import { assertMpiSupported } from '../../src/mpi/support.js';
import { parseCommandArguments } from '../../src/scripts/dependency-graph.js';

test('path entries are prepended once and preserve order', () => {
  assert.equal(
    prependPathEntries(['/new', '/shared'], '/shared:/old', ':'),
    '/new:/shared:/old',
  );
  assert.equal(
    prependPathEntries(['C:\\Bin'], 'c:\\bin;C:\\Old', ';'),
    'C:\\Bin;C:\\Old',
  );
});

test('version helpers normalize and compare requested versions', () => {
  assert.equal(firstLine('one\ntwo'), 'one');
  assert.equal(firstVersion('compiler 16.1.0 build 2'), '16.1.0');
  assert.equal(normalizeRequestedVersion(' latest '), '');
  assert.equal(normalizeRequestedVersion(' 16.1.0 '), '16.1.0');
  assert.ok(compareNumericVersions('16.1.0', '15.2.0') > 0);
  assert.ok(compareNumericVersions('23.0-1', '23.0-0') > 0);
});

test('job and command names use consistent normalization', () => {
  assert.equal(inferToolFromJobName('test_ubuntu_gfortran_fpm'), 'fpm');
  assert.equal(inferToolFromJobName('gfortran_fpm'), '');
  assert.equal(
    inferToolFromJobName('gfortran_fpm', { minimumParts: 2 }),
    'fpm',
  );
  assert.equal(inferToolFromJobName('build_linux', { minimumParts: 2 }), '');
  assert.equal(normalizeCommandName('C:\\MPI\\mpiexec.exe'), 'mpiexec');
});

test('errors use one consistent message representation', () => {
  assert.equal(getErrorMessage(new Error('failed')), 'failed');
  assert.equal(getErrorMessage('failed'), 'failed');
});

test('GitHub requests retry transient errors but not permanent responses', async () => {
  const transientError = new HttpResponseError('https://api.github.com', 502);
  let attempts = 0;
  const result = await retryOperation(
    async () => {
      attempts += 1;
      if (attempts === 1) {
        throw transientError;
      }
      return 'ok';
    },
    {
      attempts: 3,
      retryDelay: 0,
      shouldRetry: isTransientGitHubRequestError,
    },
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
  assert.equal(
    isTransientGitHubRequestError(
      new HttpResponseError('https://api.github.com', 429),
    ),
    true,
  );

  attempts = 0;
  await assert.rejects(
    () =>
      retryOperation(
        async () => {
          attempts += 1;
          throw new HttpResponseError('https://api.github.com', 404);
        },
        {
          attempts: 3,
          retryDelay: 0,
          shouldRetry: isTransientGitHubRequestError,
        },
      ),
    /HTTP 404/,
  );
  assert.equal(attempts, 1);
});

test('missing commands use one consistent diagnostic check', () => {
  assert.equal(isCommandNotFoundOutput('tool: command not found'), true);
  assert.equal(isCommandNotFoundOutput('tool version 1.0.0'), false);
});

test('MPI support validation preserves supported combinations', () => {
  assert.doesNotThrow(() => assertMpiSupported('linux', 'gfortran', 'openmpi'));
  assert.throws(
    () => assertMpiSupported('windows', 'gfortran', 'openmpi'),
    /Unsupported MPI toolchain/,
  );
});

test('HPC-X paths and Open MPI output expose their installed prefix', () => {
  assert.equal(
    extractHpcxVersionFromPath('/opt/nvidia/hpcx/2.50/ompi/bin'),
    '2.50',
  );
  assert.equal(
    extractOpenMpiPrefix('path:prefix:/opt/nvidia/hpc_sdk/hpcx-2.50'),
    '/opt/nvidia/hpc_sdk/hpcx-2.50',
  );
});

test('dependency graph options preserve quoted arguments', () => {
  assert.deepEqual(
    parseCommandArguments('--exclude "first module" --flag=value', 'options'),
    ['--exclude', 'first module', '--flag=value'],
  );
  assert.throws(
    () => parseCommandArguments('"unfinished', 'options'),
    /Unclosed quote in options/,
  );
});

test('README generators replace only their marked section', async () => {
  const temporaryDirectory = await fs.mkdtemp(
    join(os.tmpdir(), 'setup-fortran-conda-test-'),
  );
  const readmePath = join(temporaryDirectory, 'README.md');
  const startMarker = '<!-- START -->';
  const endMarker = '<!-- END -->';

  try {
    await fs.writeFile(
      readmePath,
      `Before\n${startMarker}\nOld\n${endMarker}\nAfter\n`,
      'utf8',
    );
    await replaceMarkedSection({
      filePath: readmePath,
      startMarker,
      endMarker,
      content: 'New',
    });

    assert.equal(
      await fs.readFile(readmePath, 'utf8'),
      `Before\n${startMarker}\n\nNew\n\n${endMarker}\nAfter\n`,
    );
  } finally {
    await fs.rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
});
