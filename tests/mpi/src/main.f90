module mpi_test
   use mpi_f08, only : mpi_comm_rank, mpi_comm_size, mpi_comm_world, mpi_finalize, mpi_init
   implicit none
   private
   public :: verify_mpi
contains
   subroutine verify_mpi
      integer :: ierr, rank, size

      call mpi_init(ierr)
      call mpi_comm_rank(mpi_comm_world, rank, ierr)
      call mpi_comm_size(mpi_comm_world, size, ierr)
      write(*, '(A,I0,A,I0)') 'MPI_RANK=', rank, ' MPI_SIZE=', size
      if (size /= 2 .or. rank < 0 .or. rank >= size) error stop 1
      call mpi_finalize(ierr)
   end subroutine
end module
