import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { createExtraPackageSpecs } from '../../src/packages.js';
import {
  readActionInputs,
  resolveOperatingSystem,
} from '../../src/lib/action-inputs.js';
import { applyMpiDescriptor, createMetadata } from '../../src/lib/metadata.js';
import { createMpiEnvironment } from '../../src/mpi/common.js';
import { MPI_SUPPORT } from '../../src/mpi/support.js';
import {
  createCompilerEnvironment,
  createCondaPackageSpec,
  getCondaExecutablePaths,
} from '../../src/compilers/common.js';
import { createMsvcCommandArguments } from '../../src/compilers/windows/common.js';

test('compiler environment uses the public compiler variables', () => {
  assert.deepEqual(createCompilerEnvironment('gfortran', 'gcc', 'g++'), {
    FC: 'gfortran',
    CC: 'gcc',
    CXX: 'g++',
    FPM_FC: 'gfortran',
    FPM_CC: 'gcc',
    FPM_CXX: 'g++',
    CMAKE_Fortran_COMPILER: 'gfortran',
    CMAKE_C_COMPILER: 'gcc',
    CMAKE_CXX_COMPILER: 'g++',
  });
});

test('MPI environment uses the public MPI variables', () => {
  assert.deepEqual(
    createMpiEnvironment({
      root: '/opt/mpi',
      wrappers: {
        fortran: '/opt/mpi/bin/mpifort',
        c: '/opt/mpi/bin/mpicc',
        cxx: '/opt/mpi/bin/mpicxx',
      },
      launcher: {
        command: 'mpiexec',
        numProcFlag: '-n',
      },
      resolvedLauncher: {
        command: '/opt/mpi/bin/mpiexec',
      },
      environment: {
        UCX_TLS: '^ud,ud:aux',
      },
    }),
    {
      MPIFC: '/opt/mpi/bin/mpifort',
      MPIF90: '/opt/mpi/bin/mpifort',
      MPIF77: '/opt/mpi/bin/mpifort',
      MPICC: '/opt/mpi/bin/mpicc',
      MPICXX: '/opt/mpi/bin/mpicxx',
      MPIEXEC: '/opt/mpi/bin/mpiexec',
      MPIEXEC_NUMPROC_FLAG: '-n',
      MPI_HOME: '/opt/mpi',
      UCX_TLS: '^ud,ud:aux',
    },
  );
});

test('supported MPI toolchains remain stable', () => {
  assert.deepEqual(MPI_SUPPORT, {
    linux: {
      gfortran: ['mpich', 'openmpi'],
      ifx: ['intelmpi'],
      nvfortran: ['hpcx'],
    },
    macos: {
      gfortran: ['mpich', 'openmpi'],
    },
    windows: {
      ifx: ['intelmpi'],
    },
  });
});

test('every compiler module exposes the same setup entry point', async () => {
  const modules = [
    'src/compilers/linux/aocc.js',
    'src/compilers/linux/aomp.js',
    'src/compilers/linux/flang.js',
    'src/compilers/linux/flang-new.js',
    'src/compilers/linux/gfortran.js',
    'src/compilers/linux/ifx.js',
    'src/compilers/linux/lfortran.js',
    'src/compilers/linux/nvfortran.js',
    'src/compilers/macos/flang.js',
    'src/compilers/macos/flang-new.js',
    'src/compilers/macos/gfortran.js',
    'src/compilers/macos/ifx.js',
    'src/compilers/macos/lfortran.js',
    'src/compilers/windows/flang.js',
    'src/compilers/windows/flang-new.js',
    'src/compilers/windows/gfortran.js',
    'src/compilers/windows/ifx.js',
    'src/compilers/windows/lfortran.js',
  ];

  for (const modulePath of modules) {
    const module = await import(`../../${modulePath}`);
    assert.equal(
      typeof module.setup,
      'function',
      `${modulePath} must export setup`,
    );
  }
});

test('action inputs preserve the documented defaults and normalization', () => {
  const inputs = readActionInputs({
    INPUT_COMPILER: 'GFORTRAN',
    INPUT_COMPILER_VERSION: ' latest ',
    INPUT_PLATFORM: 'Ubuntu-Latest',
    INPUT_EXTRA_PACKAGES: 'fypp, openblas',
    INPUT_FPM_VERSION: '0.13.0',
    INPUT_MPI: ' OpenMPI ',
    INPUT_MPI_VERSION: ' latest ',
  });

  assert.deepEqual(inputs, {
    compiler: 'gfortran',
    compilerVersion: '',
    platform: 'ubuntu-latest',
    extraPackages: ['fypp', 'openblas'],
    fpmVersion: '0.13.0',
    mpi: 'openmpi',
    mpiVersion: '',
    rawMpiVersion: 'latest',
  });
  assert.equal(resolveOperatingSystem(inputs.platform), 'linux');
  assert.equal(resolveOperatingSystem('windows-2025'), 'windows');
  assert.equal(resolveOperatingSystem('macos-26'), 'macos');
});

test('metadata keeps its public schema and MPI fields', () => {
  const inputs = {
    compiler: 'gfortran',
    compilerVersion: '',
    mpi: 'openmpi',
    mpiVersion: '',
  };
  const metadata = createMetadata(
    inputs,
    {
      family: 'ubuntu',
      version: '24.04',
      label: 'ubuntu 24.04',
    },
    {
      GITHUB_REPOSITORY: 'owner/repository',
      GITHUB_RUN_ID: '42',
      RUNNER_OS: 'Linux',
      RUNNER_ARCH: 'X64',
      RUNNER_NAME: 'GitHub Actions 1',
      FC: 'gfortran',
    },
  );

  assert.equal(metadata.schema_version, 2);
  assert.equal(metadata.repo, 'owner/repository');
  assert.equal(metadata.run_id, 42);
  assert.equal(metadata.compiler.requested_version, 'latest');
  assert.equal(metadata.mpi.enabled, true);
  assert.equal(metadata.mpi.implementation, 'openmpi');
  assert.equal(metadata.mpi.requested_version, 'latest');
  assert.deepEqual(metadata.mpi.bindings, {});

  applyMpiDescriptor(metadata, {
    implementation: 'openmpi',
    version: '5.0.10',
    root: '/opt/mpi',
    wrappers: { fortran: '/opt/mpi/bin/mpifort' },
    launcher: { command: '/opt/mpi/bin/mpiexec', numProcFlag: '-n' },
    bindings: { mpi_f08: true, mpi: true, mpif_h: true },
    backendCompiler: 'gfortran',
    validated: true,
  });
  assert.deepEqual(metadata.mpi, {
    enabled: true,
    requested: 'openmpi',
    requested_version: 'latest',
    implementation: 'openmpi',
    actual_version: '5.0.10',
    root: '/opt/mpi',
    wrappers: { fortran: '/opt/mpi/bin/mpifort' },
    launcher: { command: '/opt/mpi/bin/mpiexec', numProcFlag: '-n' },
    bindings: { mpi_f08: true, mpi: true, mpif_h: true },
    backend_compiler: 'gfortran',
    validated: true,
  });
});

test('versioned Conda package specifications remain stable', () => {
  assert.equal(createCondaPackageSpec('gfortran'), 'gfortran');
  assert.equal(createCondaPackageSpec('gfortran', '16.1.0'), 'gfortran=16.1.0');
});

test('default build tools and extra packages remain stable', () => {
  assert.deepEqual(createExtraPackageSpecs(['fypp'], '0.13.0'), [
    'fpm=0.13.0',
    'pkg-config',
    'cmake',
    'ninja',
    'meson',
    'fypp',
  ]);
  assert.equal(createExtraPackageSpecs([], 'latest')[0], 'fpm');
});

test('Conda executable paths remain operating-system-specific', () => {
  assert.deepEqual(getCondaExecutablePaths('/env', 'linux'), [
    join('/env', 'bin'),
  ]);
  assert.deepEqual(getCondaExecutablePaths('C:\\env', 'win32'), [
    join('C:\\env', 'bin'),
    join('C:\\env', 'Library', 'bin'),
    join('C:\\env', 'Library', 'usr', 'bin'),
    join('C:\\env', 'Scripts'),
  ]);
});

test('MSVC setup passes paths with spaces as one command argument', () => {
  const vcvarsPath =
    'C:\\Program Files\\Microsoft Visual Studio\\VC\\vcvars64.bat';
  assert.deepEqual(createMsvcCommandArguments(vcvarsPath), [
    '/d',
    '/c',
    'call',
    vcvarsPath,
    '>nul',
    '&&',
    'set',
    'PATH',
    '&&',
    'set',
    'TMP',
    '&&',
    'set',
    'INCLUDE',
    '&&',
    'set',
    'LIB',
    '&&',
    'set',
    'LIBPATH',
  ]);
});
