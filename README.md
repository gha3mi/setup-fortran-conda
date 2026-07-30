# setup-fortran-conda

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-setup--fortran--conda-blue?logo=github)](https://github.com/marketplace/actions/setup-fortran-conda)
[![CI](https://github.com/gha3mi/setup-fortran-conda/actions/workflows/CI-CD.yml/badge.svg?branch=main)](https://github.com/gha3mi/setup-fortran-conda/actions/workflows/CI-CD.yml)
[![Distribution](https://github.com/gha3mi/setup-fortran-conda/actions/workflows/dist.yml/badge.svg?branch=main)](https://github.com/gha3mi/setup-fortran-conda/actions/workflows/dist.yml)
[![Documentation](https://github.com/gha3mi/setup-fortran-conda/actions/workflows/docs.yml/badge.svg?branch=main)](https://gha3mi.github.io/setup-fortran-conda/)
[![Release](https://img.shields.io/github/v/release/gha3mi/setup-fortran-conda?sort=semver)](https://github.com/gha3mi/setup-fortran-conda/releases/latest)
[![License](https://img.shields.io/github/license/gha3mi/setup-fortran-conda)](LICENSE)

Configure supported Fortran toolchains with matching C and C++ compilers on
Ubuntu, macOS and Windows. The action also installs build tools and supports
optional MPI toolchains, additional Conda packages, documentation generation,
linting and repository status automation. Inspired by
[Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).

## Quick start

The action checks out the repository and installs `fpm`, `CMake`, `Ninja`, `Meson`
and `pkg-config` by default.

```yaml
name: test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: gfortran

      - run: fpm test --compiler "${{ env.FPM_FC }}"
```

## Compiler environment

The action configures the following matching Fortran, C and C++ compilers.

| Runner | Fortran | C | C++ |
| --- | --- | --- | --- |
| Ubuntu | [GNU Fortran][conda-gfortran] | [GNU C][conda-gcc] | [GNU C++][conda-gxx] |
| Ubuntu | [Intel Fortran][intel-ifx] | [Intel oneAPI DPC++/C++][intel-icx] | [Intel oneAPI DPC++/C++][intel-icx] |
| Ubuntu | [LFortran][conda-lfortran] | [Clang][conda-clangxx] | [Clang][conda-clangxx] |
| Ubuntu | [LLVM Flang][conda-flang] | [Clang][conda-clangxx] | [Clang][conda-clangxx] |
| Ubuntu | [NVIDIA HPC SDK Fortran][nvidia-hpc-sdk] | [NVIDIA HPC SDK C][nvidia-hpc-sdk] | [NVIDIA HPC SDK C++][nvidia-hpc-sdk] |
| Ubuntu | [AOCC (Flang)][amd-aocc] | [AOCC (Clang)][amd-aocc] | [AOCC (Clang)][amd-aocc] |
| Ubuntu | [AOMP (Flang)][amd-aomp] | [AOMP (Clang)][amd-aomp] | [AOMP (Clang)][amd-aomp] |
| macOS | [GNU Fortran][conda-gfortran] | [GNU C][homebrew-gcc] | [GNU C++][homebrew-gcc] |
| macOS | [LFortran][conda-lfortran] | [Clang][conda-clangxx] | [Clang][conda-clangxx] |
| Windows | [GNU Fortran][conda-gfortran] | [GNU C][conda-gcc] | [GNU C++][conda-gxx] |
| Windows | [Intel Fortran][intel-ifx] | [Intel oneAPI DPC++/C++][intel-icx] | [Intel oneAPI DPC++/C++][intel-icx] |
| Windows | [LFortran][conda-lfortran] | [Clang][conda-clangxx] | [Clang][conda-clangxx] |
| Windows | [LLVM Flang][conda-flang] | [Clang][conda-clang] | [Clang][conda-clang] |

[conda-gfortran]: https://anaconda.org/conda-forge/gfortran
[conda-gcc]: https://anaconda.org/conda-forge/gcc
[conda-gxx]: https://anaconda.org/conda-forge/gxx
[conda-lfortran]: https://anaconda.org/conda-forge/lfortran
[conda-flang]: https://anaconda.org/conda-forge/flang
[conda-clang]: https://anaconda.org/conda-forge/clang
[conda-clangxx]: https://anaconda.org/conda-forge/clangxx
[intel-ifx]: https://www.intel.com/content/www/us/en/developer/tools/oneapi/fortran-compiler-download.html
[intel-icx]: https://www.intel.com/content/www/us/en/developer/tools/oneapi/dpc-compiler-download.html
[nvidia-hpc-sdk]: https://developer.nvidia.com/hpc-sdk/downloads
[amd-aocc]: https://www.amd.com/en/developer/aocc.html
[amd-aomp]: https://github.com/ROCm/aomp/releases
[homebrew-gcc]: https://formulae.brew.sh/formula/gcc

The selected compiler commands are exported as environment variables for
subsequent workflow steps.

| Language | General | fpm | CMake |
| --- | --- | --- | --- |
| Fortran | `FC` | `FPM_FC` | `CMAKE_Fortran_COMPILER` |
| C | `CC` | `FPM_CC` | `CMAKE_C_COMPILER` |
| C++ | `CXX` | `FPM_CXX` | `CMAKE_CXX_COMPILER` |

## Documentation

- [Overview](https://gha3mi.github.io/setup-fortran-conda/)
- [Compilers and builds](https://gha3mi.github.io/setup-fortran-conda/toolchains.html)
- [MPI toolchains](https://gha3mi.github.io/setup-fortran-conda/mpi.html)
- [FORD documentation](https://gha3mi.github.io/setup-fortran-conda/ford.html)
- [Doxygen documentation](https://gha3mi.github.io/setup-fortran-conda/doxygen.html)
- [Fortitude linting](https://gha3mi.github.io/setup-fortran-conda/fortitude.html)
- [README CI table](https://gha3mi.github.io/setup-fortran-conda/readme-table.html)
- [Dependency graphs](https://gha3mi.github.io/setup-fortran-conda/dependency-graphs.html)
- [Status badges](https://gha3mi.github.io/setup-fortran-conda/status-badges.html)

## CI status

<!-- STATUS:setup-fortran-conda:START -->

| OS | Compiler | Version | MPI | MPI Version | fpm | cmake | meson |
| --- | --- | ---: | --- | ---: | :---: | :---: | :---: |
| ubuntu 24.04 | `aocc` | 5.2.0 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `aomp` | 23.0-0 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `flang-new` | 22.1.8 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `gfortran` | 16.1.0 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `gfortran` | 16.1.0 | `mpich` | 5.0.1 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `gfortran` | 16.1.0 | `openmpi` | 5.0.10 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `ifx` | 2026.1.1 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `ifx` | 2026.1.1 | `intelmpi` | 2021.18.1 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `lfortran` | 0.64.0 |  |  | 0.12.0 ✅ | 4.4.1 ✅ | — |
| ubuntu 24.04 | `nvfortran` | 26.5 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `nvfortran` | 26.5 | `hpcx` | 2.50 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| macos 26 | `gfortran` | 16.1.0 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| macos 26 | `gfortran` | 16.1.0 | `mpich` | 5.0.1 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| macos 26 | `gfortran` | 16.1.0 | `openmpi` | 5.0.10 | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| macos 26 | `lfortran` | 0.64.0 |  |  | 0.12.0 ✅ | 4.4.1 ✅ | — |
| windows 2025 | `flang-new` | 22.1.8 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| windows 2025 | `gfortran` | 16.1.0 |  |  | 0.13.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| windows 2025 | `ifx` | 2026.1.1 |  |  | 0.12.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| windows 2025 | `ifx` | 2026.1.1 | `intelmpi` | 2021.18.1 | 0.12.0 ✅ | 4.4.1 ✅ | 1.11.2 ✅ |
| windows 2025 | `lfortran` | 0.64.0 |  |  | 0.12.0 ✅ | 4.4.1 ✅ | — |

<!-- STATUS:setup-fortran-conda:END -->

- [fpm status](https://github.com/gha3mi/setup-fortran-conda/blob/status-fpm/STATUS.md)
- [CMake status](https://github.com/gha3mi/setup-fortran-conda/blob/status-cmake/STATUS.md)
- [Meson status](https://github.com/gha3mi/setup-fortran-conda/blob/status-meson/STATUS.md)

## Project

- [Changelog](CHANGELOG.md)
- [Releases](https://github.com/gha3mi/setup-fortran-conda/releases)
- [Issues](https://github.com/gha3mi/setup-fortran-conda/issues)
- [Maintainer release guide](RELEASING.md)
- [License](LICENSE)

## Related

- [Fortran Discourse](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [CI/CD workflow](https://github.com/gha3mi/setup-fortran-conda/blob/main/.github/workflows/CI-CD.yml)
- [fortran-lang/setup-fortran](https://github.com/fortran-lang/setup-fortran)
