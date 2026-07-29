cmake_minimum_required(VERSION 3.15)
project(fortran_hello LANGUAGES Fortran C)

enable_testing()
option(ENABLE_MPI "Build and run the MPI test" OFF)

# The conda-forge Windows LFortran binary is built without runtime stacktraces
# and rejects CMake's default -g flag. Keep the Debug configuration
# unoptimized until that package supports debug information.
if(
  WIN32
  AND CMAKE_Fortran_COMPILER_ID STREQUAL "LFortran"
  AND CMAKE_Fortran_FLAGS_DEBUG STREQUAL "-g"
)
  set(CMAKE_Fortran_FLAGS_DEBUG "")
endif()

if(APPLE AND CMAKE_Fortran_COMPILER_ID STREQUAL "LFortran")
  # LFortran currently emits no global symbol for this module procedure,
  # which makes macOS ranlib warn about an empty archive index.
  add_library(main OBJECT src/main.f90)
else()
  add_library(main STATIC src/main.f90)
endif()
add_executable(check test/check.f90)
target_link_libraries(check PRIVATE main)

add_test(NAME check COMMAND check)

if(ENABLE_MPI)
  find_package(MPI REQUIRED COMPONENTS Fortran)

  if(NOT MPI_Fortran_HAVE_F08_MODULE)
    message(FATAL_ERROR "The selected MPI toolchain does not provide mpi_f08")
  endif()

  add_executable(mpi_hello test/mpi_hello.F90)
  target_compile_definitions(mpi_hello PRIVATE USE_MPI)
  target_link_libraries(mpi_hello PRIVATE MPI::MPI_Fortran)

  add_test(
    NAME mpi_hello
    COMMAND
      ${MPIEXEC_EXECUTABLE}
      ${MPIEXEC_NUMPROC_FLAG} 2
      $<TARGET_FILE:mpi_hello>
  )
endif()
