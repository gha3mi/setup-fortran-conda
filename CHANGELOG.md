## [v0.18.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.17.1...v0.18.0) - 2026-07-30


### Features

* feat: add MPI toolchain support ([4cf6839f](https://github.com/gha3mi/setup-fortran-conda/commit/4cf6839fb21b4d9064a1b225237dd38f4dcffefd)) by [@gha3mi](https://github.com/gha3mi)
* feat: include MPI in generated status tables ([40ebfda1](https://github.com/gha3mi/setup-fortran-conda/commit/40ebfda104f2688167835a4c673c6a284f49470a)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: show em dash for non-MPI table rows ([1f8660a6](https://github.com/gha3mi/setup-fortran-conda/commit/1f8660a611c1d12af6f8d198dfd0fc48e86c3054)) by [@gha3mi](https://github.com/gha3mi)
* fix: leave non-MPI table cells empty ([03c2f84f](https://github.com/gha3mi/setup-fortran-conda/commit/03c2f84fcc7807012802baff8d7869e06f7ac7bb)) by [@gha3mi](https://github.com/gha3mi)
* fix: report Intel MPI version correctly on Windows ([a88116c0](https://github.com/gha3mi/setup-fortran-conda/commit/a88116c0c307a21c3681ecf37034216358acc488)) by [@gha3mi](https://github.com/gha3mi)
* fix: detect active HPC-X version ([afcca64c](https://github.com/gha3mi/setup-fortran-conda/commit/afcca64c21f9290ac495e910df2ff88951bdb212)) by [@gha3mi](https://github.com/gha3mi)
* fix: install latest GCC suite on Linux ([daaa5aec](https://github.com/gha3mi/setup-fortran-conda/commit/daaa5aeca53950b100cdd5877f811f599e3cad68)) by [@gha3mi](https://github.com/gha3mi)

### Others

* chore(deps): bump actions/checkout from 7.0.0 to 7.0.1 (#189) ([6fd68f98](https://github.com/gha3mi/setup-fortran-conda/commit/6fd68f987b1df295b889ef50c991ce8c52529448)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore: remove unused scripts ([50f7d2b8](https://github.com/gha3mi/setup-fortran-conda/commit/50f7d2b8f0b56f593f7c9c1336ed49a006151b4c)) by [@gha3mi](https://github.com/gha3mi)
* refactor: migrate action runtime to dist ([14ab03a7](https://github.com/gha3mi/setup-fortran-conda/commit/14ab03a7d0cc5d3c2c4cfd1323f081428cb7b7d7)) by [@gha3mi](https://github.com/gha3mi)
* ci: schedule dependency updates and full matrix weekly ([faae94f5](https://github.com/gha3mi/setup-fortran-conda/commit/faae94f5a564b279e3425d594cfe29c6e48d7eb9)) by [@gha3mi](https://github.com/gha3mi)
* refactor: unify platform setup implementations ([fd366bc8](https://github.com/gha3mi/setup-fortran-conda/commit/fd366bc83a67fec791e404189d2a2ae67610acc9)) by [@gha3mi](https://github.com/gha3mi)
* test: add portable MPI build coverage ([4653635b](https://github.com/gha3mi/setup-fortran-conda/commit/4653635b43f90fb12437243b15cf5c9f44c451a7)) by [@gha3mi](https://github.com/gha3mi)
* ci: test MPI toolchain matrix ([877134ee](https://github.com/gha3mi/setup-fortran-conda/commit/877134ee5d056883ab70d50d39af4a7a1bd6e2c9)) by [@gha3mi](https://github.com/gha3mi)
* docs: document MPI toolchain support ([5f4f0b0a](https://github.com/gha3mi/setup-fortran-conda/commit/5f4f0b0aed5a325e1c2950dbf52cb56244d05b24)) by [@gha3mi](https://github.com/gha3mi)
* docs: scope Doxygen inputs to Fortran sources ([57bcd1b1](https://github.com/gha3mi/setup-fortran-conda/commit/57bcd1b14096bd847dacdf21775906cf0498b39c)) by [@gha3mi](https://github.com/gha3mi)
* build: regenerate action distribution ([c8ed5eba](https://github.com/gha3mi/setup-fortran-conda/commit/c8ed5ebad8475d4d2f82a57e15aa4e69f8679e75)) by [@gha3mi](https://github.com/gha3mi)
* docs: add user guide and simplify README ([f8339f53](https://github.com/gha3mi/setup-fortran-conda/commit/f8339f53c47c8a871b098812ace3cf2a0be1cf4d)) by [@gha3mi](https://github.com/gha3mi)
* ci: use main action version ([857957d2](https://github.com/gha3mi/setup-fortran-conda/commit/857957d299eec9d2bb5430a47054a87d260a93dc)) by [@gha3mi](https://github.com/gha3mi)
* Merge branch 'dev' ([abca5113](https://github.com/gha3mi/setup-fortran-conda/commit/abca51137e77c98b9587b39added42443355128b)) by [@gha3mi](https://github.com/gha3mi)
* chore(deps): bump actions/configure-pages from 5 to 6 (#191) ([c31dac96](https://github.com/gha3mi/setup-fortran-conda/commit/c31dac96bda1ddedcf2e31c8715af166660504fa)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump actions/deploy-pages from 4 to 5 (#192) ([5c42ebd3](https://github.com/gha3mi/setup-fortran-conda/commit/5c42ebd3a96f6095cb8831cb28e9af3c00c2c5ff)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump actions/setup-node from 6.4.0 to 7.0.0 (#194) ([e082d774](https://github.com/gha3mi/setup-fortran-conda/commit/e082d774bbc0186cf97deaac0142d802d92b5b5b)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump actions/upload-pages-artifact from 4 to 5 (#193) ([9a86fd29](https://github.com/gha3mi/setup-fortran-conda/commit/9a86fd294be4ded725bfa6d903f98afc35b84cda)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* Update README.md status table [ci skip] (#190) ([b0eb46b8](https://github.com/gha3mi/setup-fortran-conda/commit/b0eb46b88861c5451dc35e8a080506f0840d258f)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#197) ([f3e5d2e2](https://github.com/gha3mi/setup-fortran-conda/commit/f3e5d2e2ce81aaf174625400a041ed511fd234ea)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.17.1...v0.18.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.17.1...v0.18.0)

## [v0.17.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.17.0...v0.17.1) - 2026-07-19


### Fixes

* fix: isolate lfortran from build-tool dependencies #170 ([af75ebce](https://github.com/gha3mi/setup-fortran-conda/commit/af75ebce61e755ad4ef0f43ebb28a8e921a4c1c0)) by [@gha3mi](https://github.com/gha3mi)

### Others

* chore(deps): bump actions/checkout from 6.0.2 to 6.0.3 (#176) ([9734c1ef](https://github.com/gha3mi/setup-fortran-conda/commit/9734c1ef6f60409246db39f06faaa5c9ab9957f4)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* Update README.md status table [ci skip] (#177) ([c5fa057d](https://github.com/gha3mi/setup-fortran-conda/commit/c5fa057d89b7cb3dd0ccf643fdd42b9c3b853df0)) by [@gha3mi](https://github.com/gha3mi)
* chore(deps): bump actions/checkout from 6.0.3 to 7.0.0 (#179) ([d36f85a9](https://github.com/gha3mi/setup-fortran-conda/commit/d36f85a9b87db1b5195654e77e7b2cc29955a0cf)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* Update README.md status table [ci skip] (#180) ([fe34410d](https://github.com/gha3mi/setup-fortran-conda/commit/fe34410d79f49f7122317c1f82c269c2103d844a)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#181) ([e29ce253](https://github.com/gha3mi/setup-fortran-conda/commit/e29ce2532f1ad3b63d32d615e20056dd298967d2)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#182) ([f5b7a043](https://github.com/gha3mi/setup-fortran-conda/commit/f5b7a0434b4bf666fedf6f4cbb1f38a12c66ad03)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#183) ([d5f57f56](https://github.com/gha3mi/setup-fortran-conda/commit/d5f57f56236d40adba181eac4c14fb28ea57a2b4)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#184) ([6b4b8887](https://github.com/gha3mi/setup-fortran-conda/commit/6b4b88878d2b99e8bbae830afaf216b19ba40021)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#185) ([084dc049](https://github.com/gha3mi/setup-fortran-conda/commit/084dc049abc36ebdc2b4988530abc4a3a9f6a27c)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#186) ([9441f635](https://github.com/gha3mi/setup-fortran-conda/commit/9441f63595f75fb704e4ef570111d223b1092871)) by [@gha3mi](https://github.com/gha3mi)
* refactor: remove mpi fpm test from CI ([3fc688fc](https://github.com/gha3mi/setup-fortran-conda/commit/3fc688fc9c2374280356a46280b7ec572ea9e71e)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#188) ([b1e146cc](https://github.com/gha3mi/setup-fortran-conda/commit/b1e146cc37d6a575f9b241104b7b12f4f33bd335)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.17.0...v0.17.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.17.0...v0.17.1)

## [v0.17.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.16.0...v0.17.0) - 2026-05-29


### Features

* feat: add README dependency graphs via fpm-deps and fpm-modules ([a08a0609](https://github.com/gha3mi/setup-fortran-conda/commit/a08a0609d159aa98953b7359d53c7ea21b1f6c4b)) by [@gha3mi](https://github.com/gha3mi)
* feat: rename AOCC compiler support to aocc ([f78b657b](https://github.com/gha3mi/setup-fortran-conda/commit/f78b657bc5609b3c6b8a17f2d7ef7e703ad3f9c4)) by [@gha3mi](https://github.com/gha3mi)
* feat: add AOMP compiler support ([050a8b13](https://github.com/gha3mi/setup-fortran-conda/commit/050a8b13d92afc237d457cd95d758479c7cc523c)) by [@gha3mi](https://github.com/gha3mi)

### Others

* docs: fix README ([c59bdb3e](https://github.com/gha3mi/setup-fortran-conda/commit/c59bdb3e15b65034e5875ba9e82e650e98d31df5)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#174) ([ce437640](https://github.com/gha3mi/setup-fortran-conda/commit/ce43764097a629c61055958974aab5227479acdb)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.16.0...v0.17.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.16.0...v0.17.0)

## [v0.16.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.3...v0.16.0) - 2026-05-25


### Features

* feat: add support for AMD AOCC compiler (amdflang) ([f50e8015](https://github.com/gha3mi/setup-fortran-conda/commit/f50e8015665427b4124ee842665b0f977f882f8f)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: add S241 to ignored Fortitude checks ([c5593dd2](https://github.com/gha3mi/setup-fortran-conda/commit/c5593dd24966cc53d75f82aa67720d6e9c82216d)) by [@gha3mi](https://github.com/gha3mi)
* fix: flang setup ([2e2a8dbb](https://github.com/gha3mi/setup-fortran-conda/commit/2e2a8dbbe2d255a94082dd66d976f92404eb19a2)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#169) ([42571d4e](https://github.com/gha3mi/setup-fortran-conda/commit/42571d4e2d837fdfc6c79b799be2ef57f99114dc)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#172) ([91f651d7](https://github.com/gha3mi/setup-fortran-conda/commit/91f651d7a3b03d5d75b0dafdeb462cdc306a1b02)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.15.3...v0.16.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.3...v0.16.0)

## [v0.15.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.2...v0.15.3) - 2026-05-03


### Fixes

* fix: install git in the Conda environment for LFortran setup on macOS ([0195c87a](https://github.com/gha3mi/setup-fortran-conda/commit/0195c87a26ffb7f1a5e5f3f61257f0b32a3e3acc)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.15.2...v0.15.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.2...v0.15.3)

## [v0.15.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.1...v0.15.2) - 2026-04-26


### Others

* chore(deps): bump peter-evans/create-pull-request from 8.1.0 to 8.1.1 (#163) ([c6ee8acd](https://github.com/gha3mi/setup-fortran-conda/commit/c6ee8acdeb3f90311790b290acf0a928c8a774d6)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump @actions/core from 3.0.0 to 3.0.1 (#164) ([3ab7b995](https://github.com/gha3mi/setup-fortran-conda/commit/3ab7b9950cdd681794a3397c25e270507dbb2281)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump conda-incubator/setup-miniconda from 3.3.0 to 4.0.0 (#165) ([d49c5213](https://github.com/gha3mi/setup-fortran-conda/commit/d49c52132a293ba0bbc1737295d00293bec82000)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump conda-incubator/setup-miniconda from 4.0.0 to 4.0.1 (#166) ([63ee44be](https://github.com/gha3mi/setup-fortran-conda/commit/63ee44be063ccee7caea666a5ba664ada5d9135a)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* README: ifx2026.0.0, flang22.1.4, lfortran0.63, cmake4.3.2, meson1.11.1 [ci skip] (#162) ([7439436b](https://github.com/gha3mi/setup-fortran-conda/commit/7439436b8b2672f7f6c631cc99d3d4cf90b9713f)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.15.1...v0.15.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.1...v0.15.2)

## [v0.15.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.0...v0.15.1) - 2026-04-07


### Others

* Update README.md status table [ci skip] (#156) ([754eb5fa](https://github.com/gha3mi/setup-fortran-conda/commit/754eb5fae00055923f0d0621dc4b0027a8827ad0)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#157) ([d2266017](https://github.com/gha3mi/setup-fortran-conda/commit/d2266017f29dbde1c76d2e82da3eb3383c9bfab5)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#158) ([c2c07215](https://github.com/gha3mi/setup-fortran-conda/commit/c2c07215c0d57a5149fafff4fa1d5cd05a256c0e)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#159) ([0951a369](https://github.com/gha3mi/setup-fortran-conda/commit/0951a36989eb244b29721ae63591d9b520b7f819)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#160) ([9eb85d29](https://github.com/gha3mi/setup-fortran-conda/commit/9eb85d298094bb433e163d78e7f798ee2c64c6fd)) by [@gha3mi](https://github.com/gha3mi)
* Improve logging and update CI/CD workflow reference (#161) ([0ff68f6a](https://github.com/gha3mi/setup-fortran-conda/commit/0ff68f6ae2910e98eb9d314d87236c3cc27ae425)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.15.0...v0.15.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.15.0...v0.15.1)

## [v0.15.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.14.0...v0.15.0) - 2026-03-15


### Features

* feat: add pkg-config to extra packages list ([243cf1a6](https://github.com/gha3mi/setup-fortran-conda/commit/243cf1a6a5917f155dc4c863c4070d41b9211765)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#153) ([e4aea3c9](https://github.com/gha3mi/setup-fortran-conda/commit/e4aea3c9b1884b387d025c5c3c5ea4a1c702fecd)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.14.0...v0.15.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.14.0...v0.15.0)

## [v0.14.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.13.1...v0.14.0) - 2026-03-04


### Features

* feat: auto-detect latest NVIDIA HPC SDK version (#151) ([87599c4e](https://github.com/gha3mi/setup-fortran-conda/commit/87599c4ec9c6700a08e32eb3ee50ecbcfd8e7ac9)) by [@gha3mi](https://github.com/gha3mi)

### Others

* update README.md status table ([#150](https://github.com/gha3mi/setup-fortran-conda/pull/150)) by [@gha3mi](https://github.com/gha3mi)
* update README.md status table ([#149](https://github.com/gha3mi/setup-fortran-conda/pull/149)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.13.1...v0.14.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.13.1...v0.14.0)

## [v0.13.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.13.0...v0.13.1) - 2026-02-27


### Others

* chore(deps): bump actions/upload-artifact from 4 to 7 ([#148](https://github.com/gha3mi/setup-fortran-conda/pull/148)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump actions/download-artifact from 4 to 8 ([#147](https://github.com/gha3mi/setup-fortran-conda/pull/147)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* update README.md status table ([#146](https://github.com/gha3mi/setup-fortran-conda/pull/146)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.13.0...v0.13.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.13.0...v0.13.1)

## [v0.13.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.12.0...v0.13.0) - 2026-02-27


### Features

* feat: new README table ([740ce90](https://github.com/gha3mi/setup-fortran-conda/commit/740ce900ff0c7fca07ade8e4a6163f39908a4caf)) by [@gha3mi](https://github.com/gha3mi)
* feat: compact README status table and add OS version ([c6c2cbb](https://github.com/gha3mi/setup-fortran-conda/commit/c6c2cbba8ac5fcbc492b0fcefefad4204e873b56)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: update dependencies for README status table update job ([b1076e3](https://github.com/gha3mi/setup-fortran-conda/commit/b1076e338e92880baa4a0a7beee2402e68338888)) by [@gha3mi](https://github.com/gha3mi)

### Others

* update README.md status table ([#144](https://github.com/gha3mi/setup-fortran-conda/pull/144)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.12.0...v0.13.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.12.0...v0.13.0)

## [v0.12.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.5...v0.12.0) - 2026-02-26


### Features

* feat: add optional fpm version input ([918857d](https://github.com/gha3mi/setup-fortran-conda/commit/918857d3dcb364aae00aa70631b88108303bfe84)) by [@gha3mi](https://github.com/gha3mi)
* feat: add optional fpm version input ([5121296](https://github.com/gha3mi/setup-fortran-conda/commit/512129693b50c80cded641a2385377cdb6f03ebb)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: avoid miniconda setup when not needed ([d823a9c](https://github.com/gha3mi/setup-fortran-conda/commit/d823a9cea9f9de614eb412a28ed2eb07c4620bd5)) by [@gha3mi](https://github.com/gha3mi)
* fix: remove unnecessary wait time in job runs ([9597e6c](https://github.com/gha3mi/setup-fortran-conda/commit/9597e6c66dabd543e8b68e4277dc68e6055520b3)) by [@gha3mi](https://github.com/gha3mi)
* fix: suppress output during Homebrew GCC installation ([46e93d3](https://github.com/gha3mi/setup-fortran-conda/commit/46e93d3b3fae4eac0b2da7b8e9261f63cbe07340)) by [@gha3mi](https://github.com/gha3mi)

### Others

* refactor: remove platform input ([73bd6e7](https://github.com/gha3mi/setup-fortran-conda/commit/73bd6e764480ba17961c85a1fa4d4ec32d059795)) by [@gha3mi](https://github.com/gha3mi)
* refactor: move STATUS.md generation to separate scripts ([3665c72](https://github.com/gha3mi/setup-fortran-conda/commit/3665c72c30002cbf364d90eb71cb3d388ee08eb6)) by [@gha3mi](https://github.com/gha3mi)
* revert back to latest [skip ci] ([36e233b](https://github.com/gha3mi/setup-fortran-conda/commit/36e233b4997d1d99abd4bef943474e3b7e2a61c0)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.11.5...v0.12.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.5...v0.12.0)

## [v0.11.5](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.4...v0.11.5) - 2026-01-29


### Others

* chore: set generate-status-meson to true in CI-CD.yml ([ed7d8f7](https://github.com/gha3mi/setup-fortran-conda/commit/ed7d8f777b8dc479eccdbcbeecbb9f4f6019fabf)) by [@gha3mi](https://github.com/gha3mi)
* docs: fix typo ([ac6d1c9](https://github.com/gha3mi/setup-fortran-conda/commit/ac6d1c97681938dd6997cfb612901c30e146bd49)) by [@gha3mi](https://github.com/gha3mi)
* chore: update default nvfortran version to 26.1 ([f63a9e9](https://github.com/gha3mi/setup-fortran-conda/commit/f63a9e92e6d309f7360f0e575b90f9b19635253e)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.11.4...v0.11.5](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.4...v0.11.5)

## [v0.11.4](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.3...v0.11.4) - 2026-01-29


### Others

* chore: update CI-CD.yml ([#133](https://github.com/gha3mi/setup-fortran-conda/pull/133)) by [@gha3mi](https://github.com/gha3mi)
* chore(deps): bump @actions/core from 2.0.2 to 3.0.0 ([#132](https://github.com/gha3mi/setup-fortran-conda/pull/132)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump @actions/exec from 2.0.0 to 3.0.0 ([#131](https://github.com/gha3mi/setup-fortran-conda/pull/131)) by [@dependabot[bot]](https://github.com/dependabot[bot])


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.11.3...v0.11.4](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.3...v0.11.4)

## [v0.11.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.2...v0.11.3) - 2026-01-27


### Fixes

* fix: dyld: Symbol not found: _libiconv on macOS ([#128](https://github.com/gha3mi/setup-fortran-conda/pull/128)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.11.2...v0.11.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.2...v0.11.3)

## [v0.11.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.1...v0.11.2) - 2026-01-25


### Others

* chore: update cmake configuration ([#127](https://github.com/gha3mi/setup-fortran-conda/pull/127)) by [@gha3mi](https://github.com/gha3mi)
* chore: remove lfortran debug flags from cmake ([#126](https://github.com/gha3mi/setup-fortran-conda/pull/126)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.11.1...v0.11.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.1...v0.11.2)

## [v0.11.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.0...v0.11.1) - 2026-01-25


### Others

* chore(deps): bump actions/checkout from 6.0.1 to 6.0.2 ([#123](https://github.com/gha3mi/setup-fortran-conda/pull/123)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump peter-evans/create-pull-request from 8.0.0 to 8.1.0 ([#122](https://github.com/gha3mi/setup-fortran-conda/pull/122)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump conda-incubator/setup-miniconda from 3.2.0 to 3.3.0 ([#121](https://github.com/gha3mi/setup-fortran-conda/pull/121)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump JamesIves/github-pages-deploy-action from 4.7.6 to 4.8.0 ([#120](https://github.com/gha3mi/setup-fortran-conda/pull/120)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump @actions/core from 2.0.1 to 2.0.2 ([#119](https://github.com/gha3mi/setup-fortran-conda/pull/119)) by [@dependabot[bot]](https://github.com/dependabot[bot])


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])



Full Changelog: [v0.11.0...v0.11.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.11.0...v0.11.1)

## [v0.11.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.13...v0.11.0) - 2025-12-26


### Fixes

* fix: use flang_linux-64 on Linux (fixes #117) ([#118](https://github.com/gha3mi/setup-fortran-conda/pull/118)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.13...v0.11.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.13...v0.11.0)

## [v0.10.13](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.12...v0.10.13) - 2025-12-12


### Others

* chore(deps): bump @actions/exec from 1.1.1 to 2.0.0 (#112) ([a214736](https://github.com/gha3mi/setup-fortran-conda/commit/a2147363be7ba12b8ac4e690a59d6fc8fcfab803)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump peter-evans/create-pull-request from 7.0.11 to 8.0.0 (#113) ([d1557b7](https://github.com/gha3mi/setup-fortran-conda/commit/d1557b7b33427bcd0303c9493b6b919a39a2c279)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump JamesIves/github-pages-deploy-action (#114) ([6bea952](https://github.com/gha3mi/setup-fortran-conda/commit/6bea952b9894c6e43a9dc7562f0083cadb27b3a7)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump @actions/core from 1.11.1 to 2.0.1 (#115) ([a9a4a66](https://github.com/gha3mi/setup-fortran-conda/commit/a9a4a6662c2fefe005e12f90a91dc1b3efef7cd0)) by [@dependabot[bot]](https://github.com/dependabot[bot])


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])



Full Changelog: [v0.10.12...v0.10.13](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.12...v0.10.13)

## [v0.10.12](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.11...v0.10.12) - 2025-12-09


### Others

* chore(deps): bump peter-evans/create-pull-request from 7.0.9 to 7.0.11 (#109) ([88da837](https://github.com/gha3mi/setup-fortran-conda/commit/88da837e1e7623489d8da7fef56fc5f92ec5920d)) by [@dependabot[bot]](https://github.com/dependabot[bot])


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])



Full Changelog: [v0.10.11...v0.10.12](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.11...v0.10.12)

## [v0.10.11](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.10...v0.10.11) - 2025-12-03


### Others

* Update README.md status table [ci skip] (#106) ([f072bee](https://github.com/gha3mi/setup-fortran-conda/commit/f072bee361cb8126ea84cf362581ef5268afc090)) by [@gha3mi](https://github.com/gha3mi)
* chore(deps): bump actions/checkout from 6.0.0 to 6.0.1 (#107) ([4d95b2c](https://github.com/gha3mi/setup-fortran-conda/commit/4d95b2cdb1aaa98747d537e69a377499c63346ff)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* Update README.md status table [ci skip] (#108) ([4ea0a18](https://github.com/gha3mi/setup-fortran-conda/commit/4ea0a18739e7bbf8e408a8c77dff4d4ef17b83f6)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.10...v0.10.11](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.10...v0.10.11)

## [v0.10.10](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.9...v0.10.10) - 2025-11-25


### Fixes

* fix: lfortran setup on macOS (Fixes #105) ([b7318bc](https://github.com/gha3mi/setup-fortran-conda/commit/b7318bc1145f7ed1be6e79d8284cbe441aa6e87d)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#103) ([c7167f1](https://github.com/gha3mi/setup-fortran-conda/commit/c7167f1b6309c390b01857ab34d19e3c3ee79bbe)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.9...v0.10.10](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.9...v0.10.10)

## [v0.10.9](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.8...v0.10.9) - 2025-11-25


### Fixes

* fix: complete status-table badges (#81) ([3cd802e](https://github.com/gha3mi/setup-fortran-conda/commit/3cd802e87e712b5643715e9b7e2db44951e1a7c8)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.8...v0.10.9](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.8...v0.10.9)

## [v0.10.8](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.7...v0.10.8) - 2025-11-25


### Others

* chore(deps): bump actions/checkout from 5.0.1 to 6.0.0 (#99) ([2261f5a](https://github.com/gha3mi/setup-fortran-conda/commit/2261f5a9ae2133c7b916130ac71676412b866bc1)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump peter-evans/create-pull-request from 7.0.8 to 7.0.9 (#100) ([9b7119d](https://github.com/gha3mi/setup-fortran-conda/commit/9b7119de887a020ef96b9782b32707434aa6e492)) by [@dependabot[bot]](https://github.com/dependabot[bot])


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])



Full Changelog: [v0.10.7...v0.10.8](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.7...v0.10.8)

## [v0.10.7](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.6...v0.10.7) - 2025-11-19


### Others

* chore(deps): bump JamesIves/github-pages-deploy-action (#97) ([c0fc2b8](https://github.com/gha3mi/setup-fortran-conda/commit/c0fc2b8ce7bf88601463766c63553a2910dcab57)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore(deps): bump actions/checkout from 5.0.0 to 5.0.1 (#98) ([fc62c52](https://github.com/gha3mi/setup-fortran-conda/commit/fc62c52a38ccc7ad7da67936bc7f8048a5920e89)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore: update FORD installation to use pip ([e4a7e7d](https://github.com/gha3mi/setup-fortran-conda/commit/e4a7e7dfe77d859beceae0b9b646534014c2b27e)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.6...v0.10.7](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.6...v0.10.7)

## [v0.10.6](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.5...v0.10.6) - 2025-10-01


### Fixes

* fix: remove lfortran from meson tests ([83bee89](https://github.com/gha3mi/setup-fortran-conda/commit/83bee8960ac6dae652eadcf795df8ba735e48c7d)) by [@gha3mi](https://github.com/gha3mi)
* fix: free disk space on Linux for nvfortran install ([a236277](https://github.com/gha3mi/setup-fortran-conda/commit/a236277f4b99e1df3a2de07d44d09f948e762791)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#93) ([1e40231](https://github.com/gha3mi/setup-fortran-conda/commit/1e4023197aaeda5bdb82b31910775e02c68f6f80)) by [@gha3mi](https://github.com/gha3mi)
* chore: bump nvfortran version from 25.7 to 25.9 ([370a117](https://github.com/gha3mi/setup-fortran-conda/commit/370a1177c646564e5218d48e1dc72ba16d70880d)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.5...v0.10.6](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.5...v0.10.6)

## [v0.10.5](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.4...v0.10.5) - 2025-09-04


### Fixes

* fix: LFortran + CMake on Win and macOS #69 (#92) ([d2203a8](https://github.com/gha3mi/setup-fortran-conda/commit/d2203a8e6db57a8bd3c2d45f0bf11beb68bb109d)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.4...v0.10.5](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.4...v0.10.5)

## [v0.10.4](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.3...v0.10.4) - 2025-09-03


### Fixes

* fix: install flang-rt_win-64 and set AR to lib.exe for flang on Windows (#90) ([b92dc0b](https://github.com/gha3mi/setup-fortran-conda/commit/b92dc0b279828e8175a9894d30c45ceab7320d5c)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#87) ([04cb737](https://github.com/gha3mi/setup-fortran-conda/commit/04cb7375ac3d39bdae371ea61d079013a3f42af3)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.3...v0.10.4](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.3...v0.10.4)

## [v0.10.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.2...v0.10.3) - 2025-09-03


### Fixes

* fix: set LFORTRAN_LINKER to gcc on macOS (#89) ([071ded9](https://github.com/gha3mi/setup-fortran-conda/commit/071ded9c1655576621216aa3d438a4df7a786120)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.2...v0.10.3](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.2...v0.10.3)

## [v0.10.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.1...v0.10.2) - 2025-09-03


### Fixes

* fix: install libflang-rt package on Linux (#88) ([a130bbd](https://github.com/gha3mi/setup-fortran-conda/commit/a130bbdc84a75284e22e24b3ca28be7c187e67d4)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.1...v0.10.2](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.1...v0.10.2)

## [v0.10.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.0...v0.10.1) - 2025-08-17


### Others

* docs: fix link [skip ci] ([a6c92c3](https://github.com/gha3mi/setup-fortran-conda/commit/a6c92c39fd3869e8ce3216cd480a63d1ecc8c953)) by [@gha3mi](https://github.com/gha3mi)
* chore: update latest NVIDIA HPC SDK from 25.5 to 25.7 ([e33850d](https://github.com/gha3mi/setup-fortran-conda/commit/e33850d0cfc961baab61f02a760d95823fa19483)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.10.0...v0.10.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.10.0...v0.10.1)

## [v0.10.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.9.1...v0.10.0) - 2025-08-13


### Features

* feat: PR commit inclusion in release script [skip ci] ([be769e9](https://github.com/gha3mi/setup-fortran-conda/commit/be769e91d6be8943f3480946018b329672724ab6)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: use clang as the C/C++ compiler for LFortran and switch meson status off (#83) ([1f09ad8](https://github.com/gha3mi/setup-fortran-conda/commit/1f09ad8a4a8c3bd9dbdcae8b7ef2ffced5df14d2)) by [@gha3mi](https://github.com/gha3mi)

### Others

* chore(deps): bump actions/checkout from 4.2.2 to 5.0.0 ([#82](https://github.com/gha3mi/setup-fortran-conda/pull/82)) by [@dependabot[bot]](https://github.com/dependabot[bot])
* chore: update setup action to latest version ([2735bda](https://github.com/gha3mi/setup-fortran-conda/commit/2735bdaa145a949a876090c837440f4e2251744e)) by [@gha3mi](https://github.com/gha3mi)
* chore: update job dependencies for STATUS.md generation ([44d438b](https://github.com/gha3mi/setup-fortran-conda/commit/44d438b178c4dad4e54a1f0fc9625a1c0c81caf6)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#79) ([9c9fe5a](https://github.com/gha3mi/setup-fortran-conda/commit/9c9fe5a144a595f57a8ac9202bb1df67e1ecf3e1)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#84) ([997f7cd](https://github.com/gha3mi/setup-fortran-conda/commit/997f7cddf6be4a4f9175b6786a535fc1220248b9)) by [@gha3mi](https://github.com/gha3mi)
* docs: update README.md [skip ci] ([ab15913](https://github.com/gha3mi/setup-fortran-conda/commit/ab159135cbdeb619143d54d6b1bf0e9df5dc175e)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@dependabot[bot]](https://github.com/dependabot[bot])
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.9.1...v0.10.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.9.1...v0.10.0)

## [v0.9.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.9.0...v0.9.1) - 2025-08-06


### Others

* chore: add workflow_dispatch trigger to CI/CD configuration ([112f490](https://github.com/gha3mi/setup-fortran-conda/commit/112f4901603504d1a1745d9ac29df7d59a0e18a6)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#71) ([12ef19d](https://github.com/gha3mi/setup-fortran-conda/commit/12ef19d52aadaa13bb5ec7353fd8b88604554465)) by [@gha3mi](https://github.com/gha3mi)
* docs: Update README.md ([6c07320](https://github.com/gha3mi/setup-fortran-conda/commit/6c07320e2a8575d06dee42473f56e6cd1260bff9)) by [@gha3mi](https://github.com/gha3mi)
* chore: update conditions for jobs and add verbose output for tests ([c5351fb](https://github.com/gha3mi/setup-fortran-conda/commit/c5351fbcd797acfd1ae66e4098fd5607e4276b87)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#74) ([2e04c00](https://github.com/gha3mi/setup-fortran-conda/commit/2e04c000de3476acb84914215a51fc2e4e8806da)) by [@gha3mi](https://github.com/gha3mi)
* chore: add delay to ensure jobs are visible in GitHub API before generating STATUS.md ([81c7432](https://github.com/gha3mi/setup-fortran-conda/commit/81c7432bfeff37e645c83ce00ae8e6b0236eebc2)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#75) ([8a0a864](https://github.com/gha3mi/setup-fortran-conda/commit/8a0a864bb3121756e69117ee44cb5248ed1b0743)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.9.0...v0.9.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.9.0...v0.9.1)

## [v0.9.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.8.1...v0.9.0) - 2025-08-05


### Features

* feat: add support meson [skip ci] (#70) ([798f444](https://github.com/gha3mi/setup-fortran-conda/commit/798f444b701f8c4d7782fed75469d83f5ffda820)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: mixed Clang frontends on Windows #67 (#68) ([b265963](https://github.com/gha3mi/setup-fortran-conda/commit/b265963c0ed60eec02926f9add9441d2d3ec9db4)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.8.1...v0.9.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.8.1...v0.9.0)

## [v0.8.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.8.0...v0.8.1) - 2025-08-05


### Fixes

* fix: ensure consistent compiler versions for Fortran and C/C++ (#66) ([47f99e8](https://github.com/gha3mi/setup-fortran-conda/commit/47f99e84590c484272c2cc113eb25cecee236d3a)) by [@gha3mi](https://github.com/gha3mi)

### Others

* Update README.md status table [ci skip] (#64) ([39996d9](https://github.com/gha3mi/setup-fortran-conda/commit/39996d9065b16d3e247e5c7b3325e11d7f1a103d)) by [@gha3mi](https://github.com/gha3mi)
* docs: fix C++ compiler  on Windows (clang-cl -> clang++) ([f197134](https://github.com/gha3mi/setup-fortran-conda/commit/f19713448d61a645b47054c42702e23a7158c8c2)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.8.0...v0.8.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.8.0...v0.8.1)

## [v0.8.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.7.1...v0.8.0) - 2025-07-28


### Features

* feat: Install C/C++ with Fortran, set FC/CC/CXX and FPM/CMake vars, and install CMake/Ninja by default (#63) ([c0ced6a](https://github.com/gha3mi/setup-fortran-conda/commit/c0ced6a921b6366e86cf511accb6cdd876b688bc)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.7.1...v0.8.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.7.1...v0.8.0)

## [v0.7.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.7.0...v0.7.1) - 2025-07-18


### Fixes

* fix: use --notes-file for gh release create ([00719da](https://github.com/gha3mi/setup-fortran-conda/commit/00719da6157fe5d21c9299b41b4ea2d47cdfe20e)) by [@gha3mi](https://github.com/gha3mi)
* fix: correct typo in fpm test command for release profile ([c242574](https://github.com/gha3mi/setup-fortran-conda/commit/c24257478a29de545331a1fdfdd4efa4ed287057)) by [@gha3mi](https://github.com/gha3mi)

### Others

* docs: add release automation section to README.md with usage instructions ([f8c7d14](https://github.com/gha3mi/setup-fortran-conda/commit/f8c7d14e6182d21823ea0348ddec94ff379ca2bd)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.7.0...v0.7.1](https://github.com/gha3mi/setup-fortran-conda/compare/v0.7.0...v0.7.1)

## [v0.7.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.6.0...v0.7.0) - 2025-07-11


### Features

* feat: add release automation script [skip ci] ([f088f8d](https://github.com/gha3mi/setup-fortran-conda/commit/f088f8d5a2975fa6c81642add5aee7b3165cc818)) by [@gha3mi](https://github.com/gha3mi)
* feat: add MPI support on Ubuntu and macOS using mpifort ([2760132](https://github.com/gha3mi/setup-fortran-conda/commit/2760132d13cea43e5332395a6678cbb76eafb302)) by [@gha3mi](https://github.com/gha3mi)
* feat: add extra.fortitude.check section with ignored codes ([dc8b50c](https://github.com/gha3mi/setup-fortran-conda/commit/dc8b50c4a53fbe914156ddb731045ac8b553ec04)) by [@gha3mi](https://github.com/gha3mi)

### Fixes

* fix: refine CI/CD conditions to skip unnecessary jobs ([24d3be0](https://github.com/gha3mi/setup-fortran-conda/commit/24d3be0e88887534e30e9326560301267f9b1812)) by [@gha3mi](https://github.com/gha3mi)
* fix: remove unnecessary dependency on test_mpi_fpm for README update job ([5dec78f](https://github.com/gha3mi/setup-fortran-conda/commit/5dec78fca78e66f10b18c9b52d921d619bea9fb5)) by [@gha3mi](https://github.com/gha3mi)

### Others

* docs: update README.md for clarity and additional tips ([607221b](https://github.com/gha3mi/setup-fortran-conda/commit/607221bea930d5f2b3bbd7d59cf4c20f30376621)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#61) ([8f0a5a7](https://github.com/gha3mi/setup-fortran-conda/commit/8f0a5a72bcfe22438e2d63886071802eb797599d)) by [@gha3mi](https://github.com/gha3mi)
* Update README.md status table [ci skip] (#62) ([91305e1](https://github.com/gha3mi/setup-fortran-conda/commit/91305e1b39ea9f24d58138a3a579773028f552c0)) by [@gha3mi](https://github.com/gha3mi)
* docs: add MPI support section to README.md ([f20044b](https://github.com/gha3mi/setup-fortran-conda/commit/f20044b03436cf76347edd520b67b0f1cd2c8f23)) by [@gha3mi](https://github.com/gha3mi)


### Contributors
- [@gha3mi](https://github.com/gha3mi)



Full Changelog: [v0.6.0...v0.7.0](https://github.com/gha3mi/setup-fortran-conda/compare/v0.6.0...v0.7.0)
