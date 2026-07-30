cmake_minimum_required(VERSION 4.4.1)
project(hello_test LANGUAGES Fortran C)

enable_testing()

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
  add_library(hello OBJECT src/main.f90)
else()
  add_library(hello STATIC src/main.f90)
endif()
add_executable(check test/check.f90)
target_link_libraries(check PRIVATE hello)

add_test(NAME check COMMAND check)
