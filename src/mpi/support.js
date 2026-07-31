import { setupCondaMpi } from './conda.js';
import { applyProcessEnvironment, exportMpiEnvironment } from './common.js';
import { setupHpcx } from './hpcx.js';
import { setupIntelMpi } from './intel.js';
import { validateMpi } from './validate.js';

export const MPI_SUPPORT = Object.freeze({
  linux: Object.freeze({
    gfortran: Object.freeze(['mpich', 'openmpi']),
    ifx: Object.freeze(['intelmpi']),
    nvfortran: Object.freeze(['hpcx']),
  }),
  macos: Object.freeze({
    gfortran: Object.freeze(['mpich', 'openmpi']),
  }),
  windows: Object.freeze({
    ifx: Object.freeze(['intelmpi']),
  }),
});

const MPI_INSTALLERS = Object.freeze({
  mpich: setupCondaMpi,
  openmpi: setupCondaMpi,
  intelmpi: setupIntelMpi,
  hpcx: setupHpcx,
});

function createSupportedRows(operatingSystem) {
  return Object.entries(MPI_SUPPORT[operatingSystem] || {}).flatMap(
    ([compiler, implementations]) =>
      implementations.map(
        (implementation) => `${compiler} + ${implementation}`,
      ),
  );
}

export function assertMpiSupported(operatingSystem, compiler, implementation) {
  const supported = MPI_SUPPORT[operatingSystem]?.[compiler] || [];
  if (supported.includes(implementation)) {
    return;
  }

  const rows = createSupportedRows(operatingSystem);
  throw new Error(
    [
      `Unsupported MPI toolchain: platform=${operatingSystem}, compiler=${compiler}, mpi=${implementation}.`,
      rows.length
        ? `Supported combinations on this platform: ${rows.join(', ')}.`
        : 'No MPI combinations are currently supported on this platform.',
    ].join(' '),
  );
}

export async function setupMpi({
  operatingSystem,
  compiler,
  compilerVersion,
  implementation,
  mpiVersion,
}) {
  assertMpiSupported(operatingSystem, compiler, implementation);

  const installer = MPI_INSTALLERS[implementation];
  if (!installer) {
    throw new Error(
      `No installer is available for MPI implementation "${implementation}".`,
    );
  }

  const descriptor = await installer({
    implementation,
    mpiVersion,
    compilerVersion,
    operatingSystem,
  });

  applyProcessEnvironment(descriptor.environment);
  const validated = await validateMpi(descriptor);
  await exportMpiEnvironment(validated);
  return validated;
}
