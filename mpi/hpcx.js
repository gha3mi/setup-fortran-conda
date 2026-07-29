import { info } from '@actions/core';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  commandPath,
  createMpiDescriptor,
  hostedRunnerUcxEnvironment,
} from './common.js';

function hostedCpuEnvironment() {
  const environment = hostedRunnerUcxEnvironment('lin');
  const isHostedCpuRunner =
    process.env.RUNNER_ENVIRONMENT === 'github-hosted' &&
    !existsSync('/dev/nvidia0');

  if (!isHostedCpuRunner || process.env.UCX_WARN_UNUSED_ENV_VARS) {
    return environment;
  }

  info('Disabled irrelevant UCX GPU-variable warnings on this CPU-only hosted runner');
  return {
    ...environment,
    UCX_WARN_UNUSED_ENV_VARS: 'n',
  };
}

export async function setupHpcx({ mpiVersion }) {
  if (mpiVersion) {
    throw new Error(
      'mpi-version cannot be set for hpcx because NVIDIA HPC SDK supplies the matching MPI version.'
    );
  }

  const wrapper = await commandPath('mpifort');
  const root = dirname(dirname(wrapper));

  return createMpiDescriptor({
    implementation: 'hpcx',
    root,
    wrappers: {
      fortran: wrapper,
    },
    wrapperProbeArgs: ['--showme:command'],
    versionProbe: { command: 'mpirun', args: ['--version'] },
    expectedFortranCompiler: 'nvfortran',
    environment: hostedCpuEnvironment(),
  });
}
