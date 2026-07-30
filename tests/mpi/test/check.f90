program mpi_hello
   use mpi_test, only : verify_mpi
   implicit none

   call verify_mpi()
end program
