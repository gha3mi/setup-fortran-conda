import { setFailed, setOutput, summary } from '@actions/core';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  readActionInputs,
  resolveOperatingSystem,
} from './lib/action-inputs.js';
import { getErrorMessage } from './lib/errors.js';
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
import {
  assertBlasSupported,
  configureBlasCompilerEnvironment,
  inspectBlasInstallation,
} from './blas/support.js';
import {
  exportCondaEnvironment,
  TOOLS_ENVIRONMENT_NAME,
} from './compilers/common.js';

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

async function main() {
  let fatalError = null;
  const inputs = readActionInputs();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const runnerOperatingSystem = await detectOperatingSystem();
  const metadata = createMetadata(inputs, runnerOperatingSystem);
  const fallbackSuffix = `${process.env.GITHUB_RUN_ID || 'run'}-${Date.now()}`;
  const temporaryDirectory = process.env.RUNNER_TEMP || os.tmpdir();
  let metadataPath = path.join(
    temporaryDirectory,
    `setup-fortran-conda-meta-${fallbackSuffix}.json`,
  );

  try {
    const job = await findCurrentJob(token);
    if (job?.id) {
      metadata.job.id = job.id;
      metadata.job.name = job.name || '';
      metadata.job.labels = job.labels || [];
      metadata.tool = inferToolFromJobName(job.name);
      metadataPath = path.join(
        temporaryDirectory,
        `setup-fortran-conda-meta-${job.id}.json`,
      );
    }

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
    assertBlasSupported(inputs.blas);

    const operatingSystem = resolveOperatingSystem(inputs.platform);
    if (inputs.mpi !== 'none') {
      assertMpiSupported(operatingSystem, inputs.compiler, inputs.mpi);
    }

    const { installExtras } = await import('./packages.js');
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
      await configureBlasCompilerEnvironment({
        implementation: inputs.blas,
        operatingSystem,
        compiler: inputs.compiler,
      });
      const descriptor = await inspectBlasInstallation(inputs.blas);
      applyBlasDescriptor(metadata, descriptor);
    }

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
