module main
   implicit none
   private
   public :: say_hello
contains
   subroutine say_hello
      print *, "Hello World!"
   end subroutine
end module
