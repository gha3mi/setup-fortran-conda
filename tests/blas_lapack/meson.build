project(
  'blas-lapack-test',
  'fortran',
  meson_version: '>=1.11.2',
  default_options: ['warning_level=0'],
)

lib = static_library(
  'blas_lapack_test',
  'src/main.f90',
)

blas_lapack = executable(
  'blas_lapack',
  'test/check.f90',
  link_with: lib,
  link_args: ['-llapack', '-lblas'],
)

test('blas_lapack', blas_lapack)
