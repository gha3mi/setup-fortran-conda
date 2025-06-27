# Setup Fortran with Conda

A GitHub Action that sets up a Fortran development environment using Conda. Inspired by [Conda + Fortran](https://degenerateconic.com/conda-plus-fortran.html).

## Inputs

| Name             | Description                                                       | Required | Default |
| ---------------- | ----------------------------------------------------------------- | -------- | ------- |
| `platform`       | Platform (`ubuntu-latest`, `windows-latest`, `macos-latest`) | yes      | —       |
| `compiler`       | Compiler to install (`gfortran`, `ifx`, `lfortran`, `flang`)      | yes      | —       |
| `extra-packages` | list of additional Conda packages                                 | no       | `""`    |

## Example: FPM CI Workflow

```yaml
name: CI_fpm

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    name: ${{ matrix.os }}_${{ matrix.compiler }}
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
        uses: gha3mi/setup-fortran-conda@v0.2.0
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: ${{ matrix.extra-packages }}

      - name: fpm test (debug)
        run: fpm test --compiler ${{ matrix.compiler }} --profile debug --verbose

      - name: fpm test (release)
        run: fpm test --compiler ${{ matrix.compiler }} --profile release --verbose

  summary:
    permissions:
      contents: write
    name: Generate STATUS.md
    if: always()
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate summary from GitHub API
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          RUN_ID: ${{ github.run_id }}
        run: |
          badge_line=""

          mapfile -t job_lines < <(
            curl -s -H "Authorization: token $GH_TOKEN" \
              https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs \
              | jq -r '.jobs[] | select(.name | test(".*_.*")) | [.name, .conclusion] | @tsv'
          )

          for line in "${job_lines[@]}"; do
            name="${line%%$'\t'*}"
            conclusion="${line#*$'\t'}"

            os="${name%%_*}"
            compiler="${name#*_}"
            key="${os}_${compiler}"

            # shields.io escaping
            safe_os="${os//-/'--'}"
            safe_compiler="${compiler//-/'--'}"
            safe_key="${safe_os}_${safe_compiler}"

            if [[ "$conclusion" == "success" ]]; then
              color="brightgreen"
              label="passing"
            elif [[ "$conclusion" == "failure" ]]; then
              color="red"
              label="failing"
            elif [[ "$conclusion" == "cancelled" ]]; then
              color="lightgrey"
              label="cancelled"
            else
              color="lightgrey"
              label="pending"
            fi

            badge="![${key}](https://img.shields.io/badge/${safe_key}-${label}-${color})"
            badge_line="$badge_line $badge"
          done

          echo "$badge_line" > STATUS.md

          mkdir -p status
          mv STATUS.md status/STATUS.md
          cat status/STATUS.md

      - name: Deploy STATUS.md to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4.7.3
        with:
          branch: gh-pages-status
          folder: status
          clean: true
          commit-message: "Deploy status"
```
## Example: Build FORD Documentation

```yaml
name: Doc_ford

on:
  push:
    branches: [main, dev]
permissions:
  contents: write

jobs:
  Doc_ford:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        compiler: [gfortran]
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
        uses: gha3mi/setup-fortran-conda@v0.2.0
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: ""

      - name: Build FORD Documentation
        run: ford README.md
      - name: Deploy FORD Documentation
        uses: JamesIves/github-pages-deploy-action@v4.7.3
        with:
          branch: gh-pages-ford
          folder: doc/ford
```

## Example: Build Doxygen Documentation

```yaml
name: Doc_doxygen

on:
  push:
    branches: [main, dev]
permissions:
  contents: write

jobs:
  Doc_doxygen:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        compiler: [gfortran]
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
        uses: gha3mi/setup-fortran-conda@v0.2.0
        with:
          compiler: ${{ matrix.compiler }}
          platform: ${{ matrix.os }}
          extra-packages: ""

      - name: Create Doxygen output directory
        run: mkdir -p doc/doxygen

      - name: Build Doxygen Documentation
        run: doxygen Doxyfile
      - name: Deploy Doxygen Documentation
        uses: JamesIves/github-pages-deploy-action@v4.7.3
        with:
          branch: gh-pages-doxygen
          folder: doc/doxygen
```

## See Also

- [fortran-lang/setup-fortran](fortran-lang/setup-fortran)
- [https://degenerateconic.com/conda-plus-fortran.html](https://degenerateconic.com/conda-plus-fortran.html)
- [Fortran Discourse: GitHub Action: Setup Fortran with Conda](https://fortran-lang.discourse.group/t/github-action-setup-fortran-with-conda/9869/17)
- [Fortran Discourse: Simple CI with Conda](https://fortran-lang.discourse.group/t/very-simple-ci-workflow-for-fortran-apps-using-conda/9867)