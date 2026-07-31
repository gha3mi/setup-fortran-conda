import { setFailed, setOutput, summary, warning } from '@actions/core';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  assertBlasToolchainSupported,
  inspectBlasInstallation,
} from './blas/support.js';
import {
  exportCondaEnvironment,
  TOOLS_ENVIRONMENT_NAME,
} from './compilers/common.js';
import {
  readActionInputs,
  resolveOperatingSystem,
} from './lib/action-inputs.js';
import { getErrorMessage } from './lib/errors.js';
import { getGitHubToken } from './lib/github.js';
import {
  applyBlasDescriptor,
  applyMpiDescriptor,
  createMetadata,
  inferToolFromJobName,
} from './lib/metadata.js';
import { detectOperatingSystem, findCurrentJob } from './lib/runner.js';
import {
  detectCompilerVersion,
  detectToolVersion,
} from './lib/tool-versions.js';
import { assertMpiSupported, setupMpi } from './mpi/support.js';
import { installExtras } from './packages.js';

async function writeSummary(metadata) {
  const header = ['OS', 'OS Version'];
  const row = [
    metadata.runner.os_family || metadata.runner.os,
    metadata.runner.os_version || metadata.runner.os_label,
  ];

  if (metadata.compiler.enabled) {
    header.push('Compiler', 'Version');
    row.push(metadata.compiler.requested, metadata.compiler.actual_version);
  }

  if (metadata.mpi.enabled) {
    header.push('MPI', 'MPI Version');
    row.push(metadata.mpi.implementation, metadata.mpi.actual_version);
  }

  if (metadata.blas.enabled) {
    header.push('BLAS/LAPACK');
    row.push(metadata.blas.implementation);
  }

  const toolVersion = metadata.tool
    ? metadata.tools[metadata.tool]?.version || 'Unknown'
    : '-';
  header.push('Tool', 'Tool Version');
  row.push(metadata.tool || '-', toolVersion);

  await summary.addTable([header, row]).write();
}

function setMetadataOutputs(metadata, metadataPath, fallbackSuffix) {
  const runnerTag = [
    String(process.env.RUNNER_OS || '').toLowerCase() || 'os',
    String(process.env.RUNNER_ARCH || '').toLowerCase() || 'arch',
    String(process.env.RUNNER_NAME || '')
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 32) || 'runner',
  ].join('-');
  const artifactSuffix = metadata.job.id || `${runnerTag}-${fallbackSuffix}`;

  setOutput('metadata-path', metadataPath);
  setOutput(
    'metadata-artifact-name',
    `setup-fortran-conda-meta-${artifactSuffix}`,
  );
  setOutput('job-id', metadata.job.id ? String(metadata.job.id) : '');
}

async function resolveMetadataPath(
  metadata,
  token,
  temporaryDirectory,
  fallbackSuffix,
) {
  let metadataPath = path.join(
    temporaryDirectory,
    `setup-fortran-conda-meta-${fallbackSuffix}.json`,
  );

  try {
    const job = await findCurrentJob(token);
    if (job?.id) {
      metadata.job.id = job.id;
      metadata.job.name = job.name || metadata.job.name;
      metadata.job.labels = job.labels || [];
      metadata.tool = inferToolFromJobName(job.name) || metadata.tool;
      metadataPath = path.join(
        temporaryDirectory,
        `setup-fortran-conda-meta-${job.id}.json`,
      );
    }
  } catch (error) {
    warning(
      `Unable to resolve current workflow job metadata ` +
        `(${getErrorMessage(error)}); continuing with runner metadata.`,
    );
  }

  return metadataPath;
}

function validateInputs(inputs, operatingSystem) {
  if (inputs.compiler === 'mpifort') {
    throw new Error(
      'compiler=mpifort is no longer supported because mpifort is an ' +
        'MPI wrapper, not a compiler. Use compiler=gfortran and mpi=mpich.',
    );
  }
  if (inputs.mpi === 'none' && inputs.rawMpiVersion) {
    throw new Error(
      'mpi-version requires an MPI implementation selected with the mpi input.',
    );
  }

  assertBlasToolchainSupported({
    implementation: inputs.blas,
    operatingSystem,
    compiler: inputs.compiler,
  });
  if (inputs.mpi !== 'none') {
    assertMpiSupported(operatingSystem, inputs.compiler, inputs.mpi);
  }
}

async function setupToolchain(inputs, operatingSystem, metadata) {
  await installExtras(
    TOOLS_ENVIRONMENT_NAME,
    inputs.extraPackages,
    inputs.fpmVersion,
    inputs.blas,
  );

  if (inputs.compiler) {
    const { setup } = await import(
      `./compilers/${operatingSystem}/${inputs.compiler}.js`
    );
    await setup(inputs.compilerVersion);
  }
  await exportCondaEnvironment();

  if (inputs.mpi !== 'none') {
    const descriptor = await setupMpi({
      operatingSystem,
      compiler: inputs.compiler,
      compilerVersion: inputs.compilerVersion,
      implementation: inputs.mpi,
      mpiVersion: inputs.mpiVersion,
    });
    applyMpiDescriptor(metadata, descriptor);
  }

  if (inputs.blas !== 'none') {
    const descriptor = await inspectBlasInstallation(inputs.blas);
    applyBlasDescriptor(metadata, descriptor);
  }
}

async function detectVersions(inputs, metadata) {
  if (inputs.compiler) {
    const compilerBinary = process.env.FC || inputs.compiler;
    const compilerVersion = await detectCompilerVersion(
      compilerBinary,
      inputs.compiler,
    );
    metadata.compiler.binary = compilerBinary;
    metadata.compiler.actual_version = compilerVersion.actual_version;
    metadata.compiler.raw_first_line = compilerVersion.raw_first_line;
  }

  if (metadata.tool) {
    const toolVersion = await detectToolVersion(metadata.tool);
    if (toolVersion !== null) {
      metadata.tools[metadata.tool] = { version: toolVersion };
    }
  }
}

async function main() {
  let fatalError = null;
  const inputs = readActionInputs();
  const token = getGitHubToken();
  const runnerOperatingSystem = await detectOperatingSystem();
  const metadata = createMetadata(inputs, runnerOperatingSystem);
  const fallbackSuffix = `${process.env.GITHUB_RUN_ID || 'run'}-${Date.now()}`;
  const temporaryDirectory = process.env.RUNNER_TEMP || os.tmpdir();
  const metadataPath = await resolveMetadataPath(
    metadata,
    token,
    temporaryDirectory,
    fallbackSuffix,
  );

  try {
    const operatingSystem = resolveOperatingSystem(inputs.platform);
    validateInputs(inputs, operatingSystem);
    await setupToolchain(inputs, operatingSystem, metadata);
    await detectVersions(inputs, metadata);
    await writeSummary(metadata);
  } catch (error) {
    fatalError = error;
    metadata.error = getErrorMessage(error);
  } finally {
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    setMetadataOutputs(metadata, metadataPath, fallbackSuffix);
  }

  if (fatalError) {
    throw fatalError;
  }
}

main().catch((error) => setFailed(getErrorMessage(error)));
