program mpi_blas_lapack
   use mpi_blas_lapack_test, only : verify_mpi_blas_lapack
   implicit none (type, external)

   call verify_mpi_blas_lapack()
end program mpi_blas_lapack
