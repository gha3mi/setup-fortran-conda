# Setup Fortran with Conda

A GitHub Action that sets up a Fortran development environment using Conda. Inspired by [Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).


## 📋 Workflow Example

### 🔐 IMPORTANT NOTE

> ⚠️ **Use your own name and email!** Don’t copy the example values.

To enable automatic updates to the CI status table in `README.md` via the `update_readme_table` job:

1. Create a GitHub **Personal Access Token (PAT)** with `repo` scope.
2. Add it to your repo secrets, e.g. `GH_PAT`.
3. Configure these inputs:

```yaml
update-readme-token: ${{ secrets.GH_PAT }}
update-readme-user-name: "Your Name"
update-readme-user-email: "you@example.com"
```

### Overview

This example automates Fortran CI/CD:

* 📦 **Fortran compiler setup**:

  * Supports: `gfortran`, `ifx`, `lfortran`, `flang-new`, `nvfortran`

* 🖥️ **Cross-platform testing**:

  * Ubuntu, Windows, macOS GitHub runners

* 🧪 **Testing**:

  * `fpm` test with `debug` and `release` profiles
  * `CMake` with `Ninja` and `CTest`
 
* 📄 **Documentation**:

  * [FORD](https://github.com/Fortran-FOSS-Programmers/ford) 
  * [Doxygen](https://www.doxygen.nl)

* 📊 **Status Reporting**:

  * Auto-generates `STATUS.md` for `fpm`/`cmake` test results
  * Injects summary into `README.md`
  * creates PRs to update the status table in `README.md`

* 🧹 **Linting**:

  * Runs Fortitude check


### README Integration

To enable automatic CI status table injection, add the following to your `README.md`:

<pre>
&lt;!-- STATUS:setup-fortran-conda:START --&gt;
&lt;!-- STATUS:setup-fortran-conda:END --&gt;
</pre>

### Job Breakdown

| Job Name              | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `test_fpm`            | Run `fpm` tests (debug + release) for each OS/compiler           |
| `test_cmake`          | Run CMake/Ninja builds and tests                                 |
| `doc_ford`            | Build and deploy FORD-generated docs                             |
| `doc_doxygen`         | Build and deploy Doxygen-generated docs                          |
| `status_fpm`          | Generate `STATUS.md` with fpm test results                       |
| `status_cmake`        | Generate `STATUS.md` with cmake test results                     |
| `update_readme_table` | Inject CI summary table into `README.md` and open a pull request |
| `linter_fortitude`    | Run [Fortitude](https://github.com/PlasmaFAIR/fortitude) linter  |

modify this example workflow file to your needs, and save it as `.github/workflows/CI-CD.yml` in your repository:

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

  # Run FPM tests (debug + release) on all OS/compiler combinations
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

  # Run CMake + Ninja build/tests across OS/compiler matrix
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

  # Build and deploy FORD documentation
  doc_ford:
    name: Generate FORD Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Setup and Generate FORD Documentation
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: gfortran
          generate-doc-ford: true
          ford-working-directory: .
          ford-config: README.md
          ford-output-directory: doc/ford
          ford-branch: gh-pages-ford
          ford-target-folder: doc/ford

  # Build and deploy Doxygen documentation
  doc_doxygen:
    name: Generate Doxygen Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Setup and Generate Doxygen Documentation
        uses: gha3mi/setup-fortran-conda@latest
        with:
          compiler: gfortran
          generate-doc-doxygen: true
          doxygen-working-directory: .
          doxygen-config: Doxyfile
          doxygen-output-directory: doc/doxygen
          doxygen-branch: gh-pages-doxygen
          doxygen-target-folder: doc/doxygen

  # Generate STATUS.md from FPM job results
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

  # Generate STATUS.md from CMake job results
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

  # Inject CI status table into README.md
  update_readme_table:
    name: Update README.md status table
    if: |
      always() &&
      github.ref != 'refs/heads/update-readme-table'
    needs: [status_fpm, status_cmake]
    runs-on: ubuntu-latest
    steps:
      - name: Update README status
        uses: gha3mi/setup-fortran-conda@latest
        with:
          update-readme-table: true
          update-readme-token: ${{ secrets.GH_PAT }}   # Update with your GitHub personal access token
          update-readme-user-name: "Your Name" # Update with your name
          update-readme-user-email: "you@example.com"  # Update with your email

  # Run Fortran linter with Fortitude
  linter_fortitude:
    name: Run Fortitude Linter
    runs-on: ubuntu-latest
    steps:
      - name: Run Fortitude Linter
        uses: gha3mi/setup-fortran-conda@latest
        with:
          fortitude-check: true
          fortitude-settings: "--output-format github"
```

## ✅ Status

<!-- STATUS:setup-fortran-conda:START -->
| Compiler   | macos | ubuntu | windows |
|------------|----------------------|----------------------|----------------------|
| `flang-new` | - | fpm ✅  cmake ✅ | fpm ❌  cmake ✅ |
| `gfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ❌ |
| `ifx` | - | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `lfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `nvfortran` | - | fpm ✅  cmake ❌ | - |
<!-- STATUS:setup-fortran-conda:END -->

- [STATUS.md (FPM)](https://github.com/gha3mi/setup-fortran-conda/blob/status-fpm/STATUS.md)
- [STATUS.md (CMake)](https://github.com/gha3mi/setup-fortran-conda/blob/status-cmake/STATUS.md)

## 🔗 See Also

- [fortran-lang/setup-fortran](https://github.com/fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: GitHub Action: Setup Fortran with Conda](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/17)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)
