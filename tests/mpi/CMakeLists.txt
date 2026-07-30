cmake_minimum_required(VERSION 4.4.1)
project(mpi_test LANGUAGES Fortran)

enable_testing()

find_package(MPI REQUIRED COMPONENTS Fortran)

if(NOT MPI_Fortran_HAVE_F08_MODULE)
  message(FATAL_ERROR "The selected MPI toolchain does not provide mpi_f08")
endif()

add_library(mpi_test STATIC src/main.f90)
target_link_libraries(mpi_test PUBLIC MPI::MPI_Fortran)

add_executable(mpi_hello test/check.f90)
target_link_libraries(mpi_hello PRIVATE mpi_test)

add_test(
  NAME mpi_hello
  COMMAND ${MPIEXEC_EXECUTABLE} ${MPIEXEC_NUMPROC_FLAG} 2 $<TARGET_FILE:mpi_hello>
)
