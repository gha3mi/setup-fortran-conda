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
  pull-requests: write

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
            extra-packages: ""
          - os: windows-latest
            extra-packages: ""
          - os: macos-latest
            extra-packages: ""
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
          extra-packages: ${{ matrix.extra-packages }}

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
          extra-packages: ${{ matrix.extra-packages }}

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
          ford-working-directory: .
          ford-config: README.md
          ford-output-directory: doc/ford
          ford-branch: gh-pages-ford
          ford-target-folder: doc/ford

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
          doxygen-working-directory: .
          doxygen-config: Doxyfile
          doxygen-output-directory: doc/doxygen
          doxygen-branch: gh-pages-doxygen
          doxygen-target-folder: doc/doxygen

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

  update_readme_table:
    name: Update README.md status table
    if: always()
    needs: [status_fpm, status_cmake]
    runs-on: ubuntu-latest
    steps:
      - name: Update README status
        uses: gha3mi/setup-fortran-conda@latest
        with:
          update-readme-table: true
          update-readme-token: ${{ secrets.GH_PAT }}   # Update with your GitHub personal access token
          update-readme-user-name: "Seyed Ali Ghasemi" # Update with your name
          update-readme-user-email: "info@gha3mi.com"  # Update with your email
```

## Status

<!-- STATUS:setup-fortran-conda:START -->
| Compiler   | macos | ubuntu | windows |
|------------|----------------------|----------------------|----------------------|
| `flang-new` | - | fpm ✅  cmake ✅ | fpm ❌  cmake ✅ |
| `gfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `ifx` | - | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `lfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `nvfortran` | - | fpm ✅  cmake ✅ | - |
<!-- STATUS:setup-fortran-conda:END -->

- [STATUS.md (FPM)](https://github.com/gha3mi/setup-fortran-conda/blob/status-fpm/STATUS.md)
- [STATUS.md (CMake)](https://github.com/gha3mi/setup-fortran-conda/blob/status-cmake/STATUS.md)

## See Also

- [fortran-lang/setup-fortran](https://github.com/fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: GitHub Action: Setup Fortran with Conda](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/17)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)
