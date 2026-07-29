program mpi_hello
#if defined(USE_MPI)
   use mpi_f08
   implicit none
   integer :: ierr, rank, size

   call mpi_init(ierr)
   call mpi_comm_rank(mpi_comm_world, rank, ierr)
   call mpi_comm_size(mpi_comm_world, size, ierr)
   write(*, '(A,I0,A,I0)') 'MPI_RANK=', rank, ' MPI_SIZE=', size
   if (size /= 2 .or. rank < 0 .or. rank >= size) error stop 1
   call mpi_finalize(ierr)
#else
   print *, 'MPI not enabled'
#endif
end program
