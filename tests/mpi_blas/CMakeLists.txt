cmake_minimum_required(VERSION 4.4.1)
project(mpi_blas_lapack_test LANGUAGES Fortran)

enable_testing()

find_package(MPI REQUIRED COMPONENTS Fortran)
find_library(BLAS_LIBRARY NAMES blas REQUIRED)
find_library(LAPACK_LIBRARY NAMES lapack REQUIRED)

if(NOT MPI_Fortran_HAVE_F08_MODULE)
  message(FATAL_ERROR "The selected MPI toolchain does not provide mpi_f08")
endif()

add_library(mpi_blas_lapack_test STATIC src/main.f90)
target_link_libraries(
  mpi_blas_lapack_test
  PUBLIC MPI::MPI_Fortran ${LAPACK_LIBRARY} ${BLAS_LIBRARY}
)

add_executable(mpi_blas_lapack test/check.f90)
target_link_libraries(mpi_blas_lapack PRIVATE mpi_blas_lapack_test)

add_test(
  NAME mpi_blas_lapack
  COMMAND
    ${MPIEXEC_EXECUTABLE} ${MPIEXEC_NUMPROC_FLAG} 2
    $<TARGET_FILE:mpi_blas_lapack>
)
