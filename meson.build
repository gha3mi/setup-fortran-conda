project('test', 'fortran', meson_version: '>=0.49')

src_dir = 'src'
test_dir = 'test'

src = [src_dir + '/main.f90']
test = [test_dir + '/check.f90']

inc = include_directories(src_dir)

lib = static_library('main', src, include_directories: inc)

check_exe = executable('check', test, include_directories: inc, link_with: lib)
test('check', check_exe)