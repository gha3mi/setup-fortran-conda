cmake_minimum_required(VERSION 4.4.1)
project(blas_lapack_test LANGUAGES Fortran)

enable_testing()

find_library(BLAS_LIBRARY NAMES blas REQUIRED)
find_library(LAPACK_LIBRARY NAMES lapack REQUIRED)

if(APPLE AND CMAKE_Fortran_COMPILER_ID STREQUAL "LFortran")
  add_library(blas_lapack_test OBJECT src/main.f90)
else()
  add_library(blas_lapack_test STATIC src/main.f90)
endif()

add_executable(blas_lapack test/check.f90)
target_link_libraries(
  blas_lapack
  PRIVATE blas_lapack_test ${LAPACK_LIBRARY} ${BLAS_LIBRARY}
)

add_test(NAME blas_lapack COMMAND blas_lapack)
