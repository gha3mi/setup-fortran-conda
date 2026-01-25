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

# --- Flang on Windows ---
if(WIN32 AND CMAKE_Fortran_COMPILER_ID MATCHES ".*Flang.*")
  message(WARNING "Flang-new on Windows: overriding link command to avoid rc.exe/linker issues")

  # Disable resource compiler behavior
  set(CMAKE_RC_COMPILER "")
  set(CMAKE_RC_COMPILE_OBJECT "")
  set(CMAKE_RC_FLAGS "")
  set(CMAKE_RC_OUTPUT_EXTENSION "")

  # Fully override the Fortran link step
  set(CMAKE_Fortran_LINK_EXECUTABLE
      "<CMAKE_Fortran_COMPILER> <OBJECTS> -o <TARGET> <LINK_LIBRARIES>")
endif()

add_library(main STATIC src/main.f90)
add_executable(check test/check.f90)
target_link_libraries(check PRIVATE main)

add_test(NAME check COMMAND check)