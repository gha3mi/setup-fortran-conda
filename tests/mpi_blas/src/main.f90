module mpi_blas_lapack_test
   use, intrinsic :: iso_fortran_env, only : real64
   use mpi_f08, only : mpi_allreduce, mpi_comm_rank, mpi_comm_size, mpi_comm_world, &
      mpi_finalize, mpi_init, mpi_integer, mpi_max
   ! allow(C003)
   implicit none
   private
   public :: verify_mpi_blas_lapack

   interface
      subroutine daxpy(n, alpha, x, incx, y, incy)
         import real64
         ! allow(C003)
         implicit none
         integer, intent(in) :: n, incx, incy
         real(real64), intent(in) :: alpha
         ! allow(C071)
         real(real64), intent(in) :: x(*)
         ! allow(C071)
         real(real64), intent(inout) :: y(*)
      end subroutine daxpy

      subroutine dgesv(n, nrhs, a, lda, ipiv, b, ldb, info)
         import real64
         ! allow(C003)
         implicit none
         integer, intent(in) :: n, nrhs, lda, ldb
         ! allow(C071)
         integer, intent(out) :: ipiv(*)
         integer, intent(out) :: info
         ! allow(C071)
         real(real64), intent(inout) :: a(lda, *)
         ! allow(C071)
         real(real64), intent(inout) :: b(ldb, *)
      end subroutine dgesv
   end interface

contains

   subroutine verify_mpi_blas_lapack
      real(real64), parameter :: tolerance = 100.0_real64 * epsilon(1.0_real64)
      real(real64) :: a(2, 2), b(2, 1), offset, x(3), y(3)
      integer :: global_status, ierr, info, ipiv(2), local_status, rank, size

      call mpi_init(ierr)
      if (ierr /= 0) error stop "MPI initialization failed"

      call mpi_comm_rank(mpi_comm_world, rank, ierr)
      if (ierr /= 0) error stop "MPI rank query failed"
      call mpi_comm_size(mpi_comm_world, size, ierr)
      if (ierr /= 0) error stop "MPI size query failed"

      local_status = 0
      if (size /= 2 .or. rank < 0 .or. rank >= size) local_status = 1

      offset = real(rank, real64)
      x = [1.0_real64, 2.0_real64, 3.0_real64]
      y = [4.0_real64, 5.0_real64, 6.0_real64] + offset
      call daxpy(3, 2.0_real64, x, 1, y, 1)
      if (maxval(abs(y - ([6.0_real64, 9.0_real64, 12.0_real64] + offset))) > tolerance) then
         local_status = max(local_status, 2)
      end if

      a = reshape([3.0_real64, 1.0_real64, 1.0_real64, 2.0_real64], [2, 2])
      b(:, 1) = [9.0_real64, 8.0_real64]
      call dgesv(2, 1, a, 2, ipiv, b, 2, info)
      if (info /= 0) local_status = max(local_status, 3)
      if (maxval(abs(b(:, 1) - [2.0_real64, 3.0_real64])) > tolerance) then
         local_status = max(local_status, 4)
      end if

      call mpi_allreduce(local_status, global_status, 1, mpi_integer, mpi_max, mpi_comm_world, ierr)
      if (ierr /= 0) error stop "MPI reduction failed"

      write(*, "(A,I0,A,I0,A,I0)") "MPI_RANK=", rank, " MPI_SIZE=", size, " STATUS=", local_status
      call mpi_finalize(ierr)
      if (ierr /= 0) error stop "MPI finalization failed"
      if (global_status /= 0) error stop "MPI+BLAS/LAPACK test failed"
   end subroutine verify_mpi_blas_lapack

end module mpi_blas_lapack_test
