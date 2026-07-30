program blas_lapack
   use, intrinsic :: iso_fortran_env, only : real64
   use blas_lapack_test, only : verify_blas_lapack
   implicit none

   interface
      subroutine daxpy(n, alpha, x, incx, y, incy)
         import real64
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

   real(real64) :: x(3), y(3)
   real(real64) :: a(2, 2), b(2, 1)
   integer :: ipiv(2), info

   x = [1.0_real64, 2.0_real64, 3.0_real64]
   y = [4.0_real64, 5.0_real64, 6.0_real64]
   call daxpy(3, 2.0_real64, x, 1, y, 1)

   a = reshape([3.0_real64, 1.0_real64, 1.0_real64, 2.0_real64], [2, 2])
   b(:, 1) = [9.0_real64, 8.0_real64]
   call dgesv(2, 1, a, 2, ipiv, b, 2, info)

   call verify_blas_lapack(y, b, info)
end program
