module blas_lapack_test
   use, intrinsic :: iso_fortran_env, only : real64
   implicit none
   private
   public :: verify_blas_lapack
contains
   subroutine verify_blas_lapack(y, b, info)
      real(real64), parameter :: tolerance = 100.0_real64 * epsilon(1.0_real64)
      real(real64), intent(in) :: y(3), b(2, 1)
      integer, intent(in) :: info

      if (maxval(abs(y - [6.0_real64, 9.0_real64, 12.0_real64])) > tolerance) then
         error stop "BLAS daxpy returned an incorrect result"
      end if

      if (info /= 0) error stop "LAPACK dgesv failed"
      if (maxval(abs(b(:, 1) - [2.0_real64, 3.0_real64])) > tolerance) then
         error stop "LAPACK dgesv returned an incorrect result"
      end if

      print *, "BLAS/LAPACK test passed"
   end subroutine
end module
