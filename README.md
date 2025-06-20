# Setup Fortran with Conda

A GitHub Action that sets up a Fortran development environment using Conda. Inspired by [Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).

## Inputs

| Name             | Description                                                       | Required | Default |
| ---------------- | ----------------------------------------------------------------- | -------- | ------- |
| `platform`       | Platform (`ubuntu-latest`, `windows-latest`, `macos-latest`) | yes      | —       |
| `compiler`       | Compiler to install (`gfortran`, `ifx`, `lfortran`, `flang`)      | yes      | —       |
| `extra-packages` | list of additional Conda packages                                 | no       | `""`    |

## Example Usage (CI Workflow)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        compiler: [gfortran, ifx, lfortran, flang-new]
        include:
        - os: ubuntu-latest
          extra-packages: "" # additional conda packages if needed
        - os: windows-latest
          extra-packages: "" # additional conda packages if needed
        - os: macos-latest
          extra-packages: "" # additional conda packages if needed
        exclude:
          - os: macos-latest
            compiler: flang-new
          - os: macos-latest
            compiler: ifx
          - os: windows-latest
            compiler: lfortran
          - os: windows-latest
            compiler: flang-new
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Conda
        uses: conda-incubator/setup-miniconda@v3
        with:
          auto-update-conda: true
          activate-environment: fortran
          channels: conda-forge, defaults

      - name: Setup Fortran
        uses: gha3mi/setup-fortran-conda@main
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: ${{ matrix.extra-packages }}

      - name: fpm test (debug)
        run: fpm test --compiler ${{ matrix.compiler }} --profile debug --verbose

      - name: fpm test (release)
        run: fpm test --compiler ${{ matrix.compiler }} --profile release --verbose
```

## See Also

- [fortran-lang/setup-fortran](fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)