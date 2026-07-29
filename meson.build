project(
  'test',
  'fortran',
  meson_version: '>=0.49',
  default_options: ['warning_level=0'],
)

fc = meson.get_compiler('fortran')
if fc.has_argument('-Wno-unused-command-line-argument')
  add_project_arguments(
    '-Wno-unused-command-line-argument',
    language: 'fortran',
  )
endif

src_dir = 'src'
test_dir = 'test'

src = [src_dir + '/main.f90']
test = [test_dir + '/check.f90']

inc = include_directories(src_dir)

lib = static_library('main', src, include_directories: inc)

check_exe = executable('check', test, include_directories: inc, link_with: lib)
test('check', check_exe)

if '-DUSE_MPI' in get_option('fortran_args')
  mpi = dependency('mpi', language: 'fortran', required: true)
  mpiexec = find_program('mpiexec', required: true)

  mpi_fortran_args = []
  if host_machine.system() == 'windows' and (
    fc.get_id() == 'intel-llvm' or fc.get_id() == 'intel-llvm-cl'
  )
    mpi_fortran_args += ['/fpp']
  endif

  mpi_hello = executable(
    'mpi_hello',
    test_dir + '/mpi_hello.F90',
    dependencies: mpi,
    fortran_args: mpi_fortran_args,
  )

  mpi_test_args = ['-n', '2', mpi_hello]

  test(
    'mpi_hello',
    mpiexec,
    args: mpi_test_args,
    timeout: 60,
  )
endif
