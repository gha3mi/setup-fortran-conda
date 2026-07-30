project(
  'test',
  'fortran',
  meson_version: '>=1.11.2',
  default_options: ['warning_level=0'],
)

fc = meson.get_compiler('fortran')
add_project_arguments(
  fc.get_supported_arguments('-Wno-unused-command-line-argument'),
  language: 'fortran',
)

inc = include_directories('src')

lib = static_library('main', 'src/main.f90', include_directories: inc)

check_exe = executable(
  'check',
  'test/check.f90',
  include_directories: inc,
  link_with: lib,
)
test('check', check_exe)

if '-DUSE_MPI' in get_option('fortran_args')
  mpi = dependency('mpi', language: 'fortran')
  mpiexec = find_program('mpiexec')

  mpi_args = []
  if host_machine.system() == 'windows' and fc.get_id() in ['intel-llvm', 'intel-llvm-cl']
    mpi_args += ['/fpp']
  endif

  mpi_hello = executable(
    'mpi_hello',
    'test/mpi_hello.F90',
    dependencies: mpi,
    fortran_args: mpi_args,
  )

  test(
    'mpi_hello',
    mpiexec,
    args: ['-n', '2', mpi_hello],
    timeout: 60,
  )
endif
