program mpi_hello
   use mpi_f08
   implicit none
   integer :: ierr, rank, size
   call mpi_init(ierr)
   call mpi_comm_rank(mpi_comm_world, rank, ierr)
   call mpi_comm_size(mpi_comm_world, size, ierr)
   print *, 'hello from process', rank, 'of', size
   call mpi_finalize(ierr)
end program
