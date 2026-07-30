project(
  'hello-test',
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

lib = static_library('hello', 'src/main.f90', include_directories: inc)

check_exe = executable(
  'check',
  'test/check.f90',
  include_directories: inc,
  link_with: lib,
)
test('check', check_exe)
