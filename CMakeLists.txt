cmake_minimum_required(VERSION 3.15)
project(fortran_hello LANGUAGES Fortran C)

enable_testing()

# --- LFortran on Windows ---
if(CMAKE_Fortran_COMPILER_ID STREQUAL "LFortran")
  if(WIN32)
    message(WARNING "LFortran on Windows: disabling -g and debug flags to avoid stacktrace issues.")
    set(CMAKE_Fortran_FLAGS "")
    set(CMAKE_Fortran_FLAGS_DEBUG "")
  endif()
endif()

add_library(main STATIC src/main.f90)
add_executable(check test/check.f90)
target_link_libraries(check PRIVATE main)

add_test(NAME check COMMAND check)