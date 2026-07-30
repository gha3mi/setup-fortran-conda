project(
  'mpi-test',
  'fortran',
  meson_version: '>=1.11.2',
  default_options: ['warning_level=0'],
)

mpi = dependency('mpi', language: 'fortran')
mpiexec = find_program('mpiexec')

mpi_lib = static_library(
  'mpi_test',
  'src/main.f90',
  dependencies: mpi,
)

mpi_hello = executable(
  'mpi_hello',
  'test/check.f90',
  dependencies: mpi,
  link_with: mpi_lib,
)

test(
  'mpi_hello',
  mpiexec,
  args: ['-n', '2', mpi_hello],
  timeout: 60,
)
