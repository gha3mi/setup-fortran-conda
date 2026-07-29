import { info } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { env } from 'node:process';
import {
  addExistingPaths,
  assertLinux,
  compilerEnvironment,
  exportCompilerEnvironment,
  exportProcessEnvironment,
  getCondaPrefix,
  grouped,
  setLinuxUlimits,
  verifyCommands,
} from './common.js';

const NVHPC_APT_ROOT =
  'https://developer.download.nvidia.com/hpc-sdk/ubuntu/amd64';

// Free up disk space
async function freeUpDiskSpace() {
  await grouped('setup-fortran-conda: Free Disk Space', async () => {
    await _exec('sudo', [
      'rm',
      '-rf',
      '/usr/local/lib/android',
      '/usr/local/android-sdk',
      '/usr/share/dotnet',
    ]);
  });
}

async function getLatestNVHPC() {
  let out = '';
  await _exec('bash', [
    '-c',
    "curl -Ls https://developer.nvidia.com/hpc-sdk-downloads | grep -oE 'hpc-sdk/[0-9]+\\.[0-9]+' | cut -d/ -f2 | sort -V | tail -1"
  ], {
    silent: true,
    listeners: { stdout: d => (out += d.toString()) }
  });

  return out.trim();
}

async function getNVHPCPackage(version) {
  if (!/^\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid NVIDIA HPC SDK version "${version}". Expected MAJOR.MINOR.`);
  }

  const packageId = `nvhpc-${version.replace(/\./g, '-')}`;
  let packageIndex = '';
  await _exec(
    'curl',
    [
      '--fail',
      '--location',
      '--silent',
      '--show-error',
      '--retry',
      '5',
      '--retry-all-errors',
      `${NVHPC_APT_ROOT}/Packages`,
    ],
    {
      silent: true,
      listeners: { stdout: data => (packageIndex += data.toString()) },
    }
  );

  const stanza = packageIndex
    .split(/\r?\n\r?\n/)
    .find(entry => entry.split(/\r?\n/).includes(`Package: ${packageId}`));
  const filenameLine = stanza
    ?.split(/\r?\n/)
    .find(line => line.startsWith('Filename:'));
  const packageName = basename(filenameLine?.slice('Filename:'.length).trim() || '');

  if (!packageName.endsWith('.deb')) {
    throw new Error(`NVIDIA package index does not contain ${packageId}.`);
  }

  return {
    path: join(process.env.RUNNER_TEMP || tmpdir(), packageName),
    url: `${NVHPC_APT_ROOT}/${packageName}`,
  };
}

// Main setup function
export async function setup(version) {
  assertLinux();

  await freeUpDiskSpace();

  version = version?.trim() || await getLatestNVHPC();

  // Download the package directly because NVIDIA's APT index currently uses
  // a "./" filename that its CDN does not serve.
  let nvhpcPackage;
  await grouped('setup-fortran-conda: Install NVIDIA HPC SDK', async () => {
    try {
      nvhpcPackage = await getNVHPCPackage(version);
      await _exec('curl', [
        '--fail',
        '--location',
        '--silent',
        '--show-error',
        '--retry',
        '5',
        '--retry-all-errors',
        '--continue-at',
        '-',
        '--output',
        nvhpcPackage.path,
        nvhpcPackage.url,
      ]);
      await _exec('sudo', ['apt-get', 'update', '-y']);
      await _exec('sudo', ['apt-get', 'install', '-y', nvhpcPackage.path]);
      info('NVIDIA HPC SDK installed');
    } catch (error) {
      throw new Error(`NVIDIA HPC SDK install failed: ${error.message}`);
    } finally {
      try {
        if (nvhpcPackage) await rm(nvhpcPackage.path, { force: true });
      } catch (error) {
        info(`Unable to remove NVIDIA installer: ${error.message}`);
      }
    }
  });

  const base = '/opt/nvidia/hpc_sdk';
  const arch = 'Linux_x86_64';
  const binComp = join(base, arch, version, 'compilers', 'bin');
  const binMPI = join(base, arch, version, 'comm_libs', 'mpi', 'bin');
  const libComp = join(base, arch, version, 'compilers', 'lib');
  const libMPI = join(base, arch, version, 'comm_libs', 'mpi', 'lib');

  // Conda path
  const prefix = await getCondaPrefix('fortran');
  const condaBin = join(prefix, 'bin');

  await addExistingPaths([binComp, binMPI, condaBin]);

  await verifyCommands([
    { command: 'nvfortran', args: ['--version'] },
    { command: 'nvc', args: ['--version'] },
    { command: 'nvc++', args: ['--version'] },
  ]);

  // Export compiler-related environment variables
  await exportCompilerEnvironment(
    compilerEnvironment('nvfortran', 'nvc', 'nvc++', {
      LD_LIBRARY_PATH: [libComp, libMPI, env.LD_LIBRARY_PATH || '']
        .filter(Boolean)
        .join(':'),
      NVHPC: base,
    })
  );

  await setLinuxUlimits();
  await exportProcessEnvironment();

  info('✅ compiler setup complete');
}
