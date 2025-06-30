<!-- STATUS:START -->
 ![ubuntu-latest_ifx](https://img.shields.io/badge/ubuntu--latest_ifx-passing-brightgreen) ![ubuntu-latest_lfortran](https://img.shields.io/badge/ubuntu--latest_lfortran-passing-brightgreen) ![macos-latest_gfortran](https://img.shields.io/badge/macos--latest_gfortran-passing-brightgreen) ![ubuntu-latest_flang-new](https://img.shields.io/badge/ubuntu--latest_flang--new-passing-brightgreen) ![ubuntu-latest_gfortran](https://img.shields.io/badge/ubuntu--latest_gfortran-passing-brightgreen) ![ubuntu-latest_nvfortran](https://img.shields.io/badge/ubuntu--latest_nvfortran-passing-brightgreen) ![macos-latest_lfortran](https://img.shields.io/badge/macos--latest_lfortran-passing-brightgreen) ![windows-latest_gfortran](https://img.shields.io/badge/windows--latest_gfortran-passing-brightgreen) ![windows-latest_ifx](https://img.shields.io/badge/windows--latest_ifx-passing-brightgreen) ![windows-latest_flang-new](https://img.shields.io/badge/windows--latest_flang--new-failing-red) ![windows-latest_lfortran](https://img.shields.io/badge/windows--latest_lfortran-passing-brightgreen)
<!-- STATUS:END -->

# Setup Fortran with Conda

A GitHub Action that sets up a Fortran development environment using Conda. Inspired by [Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).


## Usage Example

```yaml
name: Setup Fortran Conda CI/CD

on:
  push:
    branches: [main, master, dev]
  pull_request:
    branches: [main, master]

permissions:
  contents: write

jobs:
  test_fpm:
    name: ${{ matrix.os }}_${{ matrix.compiler }}_fpm
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        compiler: [gfortran, ifx, lfortran, flang-new, nvfortran]
        include:
          - os: ubuntu-latest
            extra-packages: "cmake, ninja"
          - os: windows-latest
            extra-packages: "cmake, ninja"
          - os: macos-latest
            extra-packages: "cmake, ninja"
        exclude:
          - os: macos-latest
            compiler: flang-new
          - os: macos-latest
            compiler: ifx
          - os: macos-latest
            compiler: nvfortran
          - os: windows-latest
            compiler: nvfortran

    steps:
      - name: Setup Fortran
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: ""

      - name: fpm test (debug)
        run: fpm test --compiler ${{ matrix.compiler }} --profile debug --verbose

      - name: fpm test (release)
        run: fpm test --compiler ${{ matrix.compiler }} --profile release --verbose

  test_cmake:
    name: ${{ matrix.os }}_${{ matrix.compiler }}_cmake
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        compiler: [gfortran, ifx, lfortran, flang-new, nvfortran]
        include:
          - os: ubuntu-latest
            extra-packages: "cmake, ninja"
          - os: windows-latest
            extra-packages: "cmake, ninja"
          - os: macos-latest
            extra-packages: "cmake, ninja"
        exclude:
          - os: macos-latest
            compiler: flang-new
          - os: macos-latest
            compiler: ifx
          - os: macos-latest
            compiler: nvfortran
          - os: windows-latest
            compiler: nvfortran

    steps:
      - name: Setup Fortran
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: "cmake, ninja"
      - name: cmake test (debug)
        run: |
          cmake -S . -B build/debug -DCMAKE_BUILD_TYPE=Debug -DCMAKE_Fortran_COMPILER=${{ matrix.compiler }} -G Ninja
          cmake --build build/debug
          ctest --test-dir build/debug --output-on-failure

      - name: cmake test (release)
        run: |
          cmake -S . -B build/release -DCMAKE_BUILD_TYPE=Release -DCMAKE_Fortran_COMPILER=${{ matrix.compiler }} -G Ninja
          cmake --build build/release
          ctest --test-dir build/release --output-on-failure

  doc_ford:
    name: Generate FORD Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Setup and Generate FORD Documentation
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: gfortran
          platform: ubuntu-latest
          generate-doc-ford: true
          ford-config: README.md
          ford-branch: gh-pages-ford

  doc_doxygen:
    name: Generate Doxygen Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Setup and Generate Doxygen Documentation
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: gfortran
          platform: ubuntu-latest
          generate-doc-doxygen: true
          doxygen-config: Doxyfile
          doxygen-branch: gh-pages-doxygen


  status_fpm:
    name: Generate STATUS.md
    if: always()
    needs: test_fpm
    runs-on: ubuntu-latest
    steps:
      - name: Generate summary
        uses: gha3mi/setup-fortran-conda@latest
        with:
          generate-status-fpm: true

  status_cmake:
    name: Generate STATUS.md
    if: always()
    needs: test_cmake
    runs-on: ubuntu-latest
    steps:
      - name: Generate summary
        uses: gha3mi/setup-fortran-conda@latest
        with:
          generate-status-cmake: true
```


## See Also

- [fortran-lang/setup-fortran](fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: GitHub Action: Setup Fortran with Conda](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/17)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)
