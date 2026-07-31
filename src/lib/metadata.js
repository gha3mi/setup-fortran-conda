export const TOOL_ORDER = Object.freeze(['fpm', 'cmake', 'meson']);

export function inferToolFromJobName(jobName, { minimumParts = 3 } = {}) {
  const parts = String(jobName || '').split('_');
  return parts.length >= minimumParts ? parts.at(-1) : '';
}

export function createMetadata(
  inputs,
  operatingSystem,
  environment = process.env,
) {
  const mpiEnabled = inputs.mpi !== 'none';

  return {
    schema_version: 2,
    repo: environment.GITHUB_REPOSITORY || '',
    run_id: Number(environment.GITHUB_RUN_ID || 0),
    created_at: new Date().toISOString(),
    job: {
      id: null,
      name: '',
      labels: [],
    },
    runner: {
      os: environment.RUNNER_OS || '',
      arch: environment.RUNNER_ARCH || '',
      name: environment.RUNNER_NAME || '',
      os_family: operatingSystem.family,
      os_version: operatingSystem.version,
      os_label: operatingSystem.label,
    },
    compiler: {
      requested: inputs.compiler,
      requested_version: inputs.compilerVersion || 'latest',
      binary: environment.FC || inputs.compiler,
      actual_version: 'Unknown',
      raw_first_line: 'Unknown',
    },
    mpi: {
      enabled: mpiEnabled,
      requested: inputs.mpi,
      requested_version: inputs.mpiVersion || 'latest',
      implementation: mpiEnabled ? inputs.mpi : 'none',
      actual_version: mpiEnabled ? 'Unknown' : '',
      root: '',
      wrappers: {},
      launcher: {},
      bindings: {},
      backend_compiler: '',
      validated: false,
    },
    tool: '',
    tools: {},
    error: '',
  };
}

export function applyMpiDescriptor(metadata, descriptor) {
  metadata.mpi.implementation = descriptor.implementation;
  metadata.mpi.actual_version = descriptor.version;
  metadata.mpi.root = descriptor.root;
  metadata.mpi.wrappers = descriptor.wrappers;
  metadata.mpi.launcher = descriptor.launcher;
  metadata.mpi.bindings = descriptor.bindings;
  metadata.mpi.backend_compiler = descriptor.backendCompiler;
  metadata.mpi.validated = descriptor.validated;
}
