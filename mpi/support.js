import { setupCondaMpi } from './conda.js';
import { applyEnvironment, exportMpiEnvironment } from './common.js';
import { setupHpcx } from './hpcx.js';
import { setupIntelMpi } from './intel.js';
import { validateMpi } from './validate.js';

export const MPI_SUPPORT = Object.freeze({
  lin: Object.freeze({
    gfortran: Object.freeze(['mpich', 'openmpi']),
    ifx: Object.freeze(['intelmpi']),
    nvfortran: Object.freeze(['hpcx']),
  }),
  mac: Object.freeze({
    gfortran: Object.freeze(['mpich', 'openmpi']),
  }),
  win: Object.freeze({
    ifx: Object.freeze(['intelmpi']),
  }),
});

const MPI_INSTALLERS = {
  mpich: (options) =>
    setupCondaMpi({ ...options, implementation: 'mpich' }),
  openmpi: (options) =>
    setupCondaMpi({ ...options, implementation: 'openmpi' }),
  intelmpi: ({ mpiVersion, osKey }) =>
    setupIntelMpi({ mpiVersion, osKey }),
  hpcx: ({ mpiVersion }) => setupHpcx({ mpiVersion }),
};

function supportedRows(osKey) {
  return Object.entries(MPI_SUPPORT[osKey] || {}).flatMap(
    ([compiler, implementations]) =>
      implementations.map(
        (implementation) => `${compiler} + ${implementation}`
      )
  );
}

export function assertMpiSupported(osKey, compiler, implementation) {
  const supported = MPI_SUPPORT[osKey]?.[compiler] || [];
  if (supported.includes(implementation)) return;

  const rows = supportedRows(osKey);
  throw new Error(
    [
      `Unsupported MPI toolchain: platform=${osKey}, compiler=${compiler}, mpi=${implementation}.`,
      rows.length
        ? `Supported combinations on this platform: ${rows.join(', ')}.`
        : 'No MPI combinations are currently supported on this platform.',
    ].join(' ')
  );
}

export async function setupMpi({
  osKey,
  compiler,
  compilerVersion,
  implementation,
  mpiVersion,
}) {
  assertMpiSupported(osKey, compiler, implementation);

  const install = MPI_INSTALLERS[implementation];
  if (!install) {
    throw new Error(
      `No installer is available for MPI implementation "${implementation}".`
    );
  }

  const descriptor = await install({
    mpiVersion,
    compilerVersion,
    osKey,
  });

  applyEnvironment(descriptor.environment);
  const validated = await validateMpi(descriptor);
  await exportMpiEnvironment(validated);
  return validated;
}
