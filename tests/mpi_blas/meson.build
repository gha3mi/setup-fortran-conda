project(
  'mpi-blas-lapack-test',
  'fortran',
  meson_version: '>=1.11.2',
)

mpi = dependency('mpi', language: 'fortran')
mpiexec = find_program('mpiexec')

mpi_blas_lapack_lib = static_library(
  'mpi_blas_lapack_test',
  'src/main.f90',
  dependencies: mpi,
)

mpi_blas_lapack = executable(
  'mpi_blas_lapack',
  'test/check.f90',
  dependencies: mpi,
  link_with: mpi_blas_lapack_lib,
  link_args: ['-llapack', '-lblas'],
)

test(
  'mpi_blas_lapack',
  mpiexec,
  args: ['-n', '2', mpi_blas_lapack],
  timeout: 60,
)
