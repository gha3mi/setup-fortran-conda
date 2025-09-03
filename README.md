# Setup Fortran with Conda

A GitHub Action that sets up a Fortran development environment using Conda. Inspired by [Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).

## Supported Compiler Configurations

The selected Fortran compiler is installed along with the corresponding C and C++ compilers, as well as `fpm`, `cmake`, `ninja` and `meson`. Additional packages can be installed using the `extra-packages` input.

### Ubuntu

| Fortran Compiler | C Compiler | C++ Compiler |
| ---------------- | ---------- | ------------ |
| gfortran         | gcc        | g++          |
| ifx              | icx        | icx          |
| lfortran         | clang      | clang++      |
| flang, flang-new | clang      | clang++      |
| nvfortran        | nvc        | nvc++        |

### macOS

| Fortran Compiler | C Compiler | C++ Compiler |
| ---------------- | ---------- | ------------ |
| gfortran         | gcc        | g++          |
| lfortran         | clang      | clang++      |

### Windows

| Fortran Compiler | C Compiler | C++ Compiler |
| ---------------- | ---------- | ------------ |
| gfortran         | gcc        | g++          |
| ifx              | icx        | icx          |
| lfortran         | clang-cl   | clang-cl     |
| flang, flang-new | clang-cl   | clang-cl     |

**The following environment variables are automatically set:**

* `FC`, `CC`, `CXX`
* `FPM_FC`, `FPM_CC`, `FPM_CXX`
* `CMAKE_Fortran_COMPILER`, `CMAKE_C_COMPILER`, `CMAKE_CXX_COMPILER`

## Simple Usage

```yaml
name: Setup Fortran Conda CI/CD

on: [push]
permissions:
  contents: write
jobs:
  test_fpm:
    name: ${{ matrix.os }}_${{ matrix.compiler }}_fpm
    runs-on: ${{ matrix.os }}
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        compiler: [gfortran, ifx, lfortran, flang-new, nvfortran]
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

      - name: fpm test (debug)
        run: fpm test --compiler ${{ matrix.compiler }} --profile debug

      - name: fpm test (release)
        run: fpm test --compiler ${{ matrix.compiler }} --profile release
```

## ✅ CI Status

<!-- STATUS:setup-fortran-conda:START -->
| Compiler   | macos | ubuntu | windows |
|------------|----------------------|----------------------|----------------------|
| `flang-new` | - | fpm ✅  cmake ✅ | fpm ❌  cmake ✅ |
| `gfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `ifx` | - | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ |
| `lfortran` | fpm ✅  cmake ✅ | fpm ✅  cmake ✅ | fpm ✅  cmake ❌ |
| `mpifort` | mpi_fpm ✅ | mpi_fpm ✅ | - |
| `nvfortran` | - | fpm ✅  cmake ✅ | - |
<!-- STATUS:setup-fortran-conda:END -->

- [STATUS.md (FPM)](https://github.com/gha3mi/setup-fortran-conda/blob/status-fpm/STATUS.md)
- [STATUS.md (CMake)](https://github.com/gha3mi/setup-fortran-conda/blob/status-cmake/STATUS.md)
<!-- - [STATUS.md (Meson)](https://github.com/gha3mi/setup-fortran-conda/blob/status-meson/STATUS.md) -->


## 📋 Workflow Example

### 🔐 IMPORTANT NOTES

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

💡 Tip: When integrating CI/CD, testing often requires multiple commits and iterations.
To keep your `main` branch clean, consider using a separate branch (e.g., `dev`) for development and testing. Once everything is working, you can merge it into main.

You can include only the jobs you need in your workflow. This example includes all available jobs to demonstrate a comprehensive CI/CD setup.

### Overview

This example automates Fortran CI/CD:

* 📦 **Fortran compiler setup**:

  * Supports: `gfortran`, `ifx`, `lfortran`, `flang-new`, `nvfortran`

* 🖥️ **Cross-platform testing**:

  * Ubuntu, Windows, macOS GitHub runners

* 🧪 **Testing**:

  * `fpm` test with `debug` and `release` profiles
  * `CMake` with `Ninja` and `CTest`
  * `Meson` with `Ninja`
 
* 📄 **Documentation**:

  * [FORD](https://github.com/Fortran-FOSS-Programmers/ford) 
  * [Doxygen](https://www.doxygen.nl)

* 📊 **Status Reporting**:

  * Auto-generates `STATUS.md` for `fpm`/`cmake`/`meson` test results
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
| `test_meson`          | Run Meson builds and tests                                       |
| `doc_ford`            | Build and deploy FORD-generated docs                             |
| `doc_doxygen`         | Build and deploy Doxygen-generated docs                          |
| `status_fpm`          | Generate `STATUS.md` with fpm test results                       |
| `status_cmake`        | Generate `STATUS.md` with cmake test results                     |
| `status_meson`        | Generate `STATUS.md` with meson test results                     |
| `update_readme_table` | Inject CI summary table into `README.md` and open a pull request |
| `linter_fortitude`    | Run [Fortitude](https://github.com/PlasmaFAIR/fortitude) linter  |

modify this example workflow file to your needs, and save it as `.github/workflows/CI-CD.yml` in your repository:

```yaml
name: Setup Fortran Conda CI/CD

on:
  push:
    branches: [main, master, dev]

permissions:
  contents: write

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

  # Run Meson builds and tests across OS/compiler matrix
  test_meson:
    name: ${{ matrix.os }}_${{ matrix.compiler }}_meson
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

      - name: meson test (debug)
        run: |
          meson setup --wipe build/meson/debug --buildtype debug --backend=ninja
          meson compile -C build/meson/debug --verbose
          meson test -C build/meson/debug --verbose

      - name: meson test (release)
        run: |
          meson setup --wipe build/meson/release --buildtype release --backend=ninja
          meson compile -C build/meson/release --verbose
          meson test -C build/meson/release --verbose

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

  # Generate STATUS.md from Meson job results
  status_meson:
    name: Generate STATUS.md
    if: always()
    needs: test_meson
    runs-on: ubuntu-latest
    steps:
      - name: Generate summary
        uses: gha3mi/setup-fortran-conda@latest
        with:
          generate-status-meson: true

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

### Specifying Compiler Versions

By default, the above example installs the latest available versions of each compiler.
To use a specific version, add a `compiler-version` entry in your matrix:

```yml
matrix:
  # os: [ubuntu-latest, macos-latest, windows-latest]
  # compiler: [gfortran, ifx, lfortran, flang-new, nvfortran]
  include:
    # gfortran
    - os: ubuntu-latest
      compiler: gfortran
      compiler-version: 15.1.0
      extra-packages: ""
    - os: macos-latest
      compiler: gfortran
      compiler-version: 15.1.0
      extra-packages: ""
    - os: windows-latest
      compiler: gfortran
      compiler-version: 15.1.0
      extra-packages: ""
```

Then, reference `compiler-version` in the setup step:

```yaml
- name: Setup Fortran
  uses: gha3mi/setup-fortran-conda@latest
  with:
    compiler: ${{ matrix.compiler }}
    compiler-version: ${{ matrix.compiler-version }} # must be specified
    platform: ${{ matrix.os }}
    extra-packages: ${{ matrix.extra-packages }}
```
If `compiler-version` is set to an empty string `""`, the latest version will be installed.

### MPI Support

MPI-based tests can be executed using fpm with the mpifort. This is currently supported on Linux and macOS runners. The following example job sets up the environment and runs parallel MPI tests:

```yml
test_mpi_fpm:
  name: ${{ matrix.os }}_${{ matrix.compiler }}_mpi_fpm
  runs-on: ${{ matrix.os }}
  strategy:
    fail-fast: false
    matrix:
      os: [ubuntu-latest, macos-latest]
      compiler: [mpifort]
      include:
        - os: ubuntu-latest
          extra-packages: ""
        - os: macos-latest
          extra-packages: ""

  steps:
    - name: Setup Fortran
      uses: gha3mi/setup-fortran-conda@latest
      with:
        compiler: ${{ matrix.compiler }}
        platform: ${{ matrix.os }}
        extra-packages: ${{ matrix.extra-packages }}

    - name: fpm test (debug)
      run: fpm test --target mpi_hello --compiler ${{ matrix.compiler }} --profile debug --flag "-cpp -DUSE_MPI" --runner "mpirun -np 4" --verbose

    - name: fpm test (release)
      run: fpm test --target mpi_hello --compiler ${{ matrix.compiler }} --profile release --flag "-cpp -DUSE_MPI" --runner "mpirun -np 4" --verbose
```

## 🚀 Release Automation

This project includes a Bash script for automating GitHub releases.

```
curl -L https://raw.githubusercontent.com/gha3mi/setup-fortran-conda/main/release.sh -o release.sh
```
### Features

The script automates:

- ✅ **Semantic versioning**: Calculates the next version (`major`, `minor`, or `patch`) based on PR titles and commit messages.
- 📝 **CHANGELOG generation**: Compiles a categorized `CHANGELOG.md` using PR data and commits since the last release.
- 🔖 **Git tagging**: Tags the new version (e.g., `v1.2.3`) and updates the floating `latest` tag.
- 📤 **GitHub Release**: Publishes a release with autogenerated notes.
- 💻 **Modes**:
  - `--dry-run`: Simulates the release steps with no side effects.
  - `--local`: Updates files and tags locally, but skips pushing or publishing the release.

### Requirements

- [GitHub CLI (`gh`)](https://cli.github.com/) – must be authenticated (`gh auth login`)
- [`jq`](https://stedolan.github.io/jq/)

### Usage

```bash
bash release.sh --help
```

### Recommended Workflow

It’s highly recommended to first run in `--dry-run` mode to verify the output.

## 🔗 See Also

- [fortran-lang/setup-fortran](https://github.com/fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: GitHub Action: Setup Fortran with Conda](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)
