# setup-fortran-conda

Configure supported Fortran toolchains with matching C and C++ compilers on
Ubuntu, macOS and Windows. The action also installs build tools and supports
optional MPI toolchains, additional Conda packages, documentation generation,
linting and repository status automation. Inspired by
[Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).

## Quick start

The action checks out the repository and installs `fpm`, CMake, Ninja, Meson
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

| OS | Compiler | Version | fpm | cmake | meson |
| --- | --- | ---: | :---: | :---: | :---: |
| ubuntu 24.04 | `aocc` | 5.2.0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `aomp` | 23.0-0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `flang-new` | 22.1.8 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `gfortran` | 15.2.0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `ifx` | 2026.1.0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| ubuntu 24.04 | `lfortran` | 0.64.0 | 0.12.0 ✅ | 4.4.0 ✅ | — |
| ubuntu 24.04 | `nvfortran` | 26.5 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| macos 26 | `gfortran` | 15.2.0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| macos 26 | `lfortran` | 0.64.0 | 0.12.0 ✅ | 4.4.0 ✅ | — |
| windows 2025 | `flang-new` | 22.1.8 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| windows 2025 | `gfortran` | 15.2.0 | 0.13.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| windows 2025 | `ifx` | 2026.1.0 | 0.12.0 ✅ | 4.4.0 ✅ | 1.11.2 ✅ |
| windows 2025 | `lfortran` | 0.64.0 | 0.12.0 ✅ | 4.4.0 ✅ | — |

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

- [fortran-lang/setup-fortran](https://github.com/fortran-lang/setup-fortran)
- [Fortran Discourse announcement](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/)
