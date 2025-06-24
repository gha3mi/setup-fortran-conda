program check
   use, intrinsic :: iso_fortran_env, only: real64
   use main
   implicit none
   real(real64) :: x
   call say_hello()
   x = 1.0_real64
   print *, "x = ", x
end program
