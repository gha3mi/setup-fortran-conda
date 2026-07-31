# Maintaining

## Requirements

- Node.js 24 and npm
- Git

## Repository

| Path | Purpose |
| --- | --- |
| `src/` | Action source code |
| `dist/` | Generated action bundle committed to Git |
| `tests/javascript/` | JavaScript tests |
| `tests/` | Fortran, MPI and BLAS/LAPACK test projects |
| `docs/` | GitHub Pages documentation |
| `scripts/` | Repository maintenance scripts |

`action.yml` inputs, outputs and exported environment variables are the public
API. Keep tests and documentation consistent with intentional API changes.

Do not edit `dist/` manually or commit `node_modules/`.

## Development

Install the locked dependencies and validate the source:

```bash
npm ci
npm run format
npm run check
npm run build
```

Commit the source and regenerated `dist/` together. On a clean committed tree,
verify that the bundle is synchronized:

```bash
npm run check-dist
```

Normal pull requests only verify `dist/`. Dependabot pull requests rebuild and
commit it automatically.

## Dependencies

Prefer Dependabot updates. For a manual update:

```bash
npm install package-name@version
npm run check
npm run build
```

Commit `package.json`, `package-lock.json` and the regenerated `dist/`.

## Before merging

- Confirm all GitHub Actions checks pass.
- Confirm `dist/` is synchronized.
- Review public API and documentation changes.
- Confirm the working tree is clean.

## Releases

`release.sh` determines the next semantic version from commits since the
previous release, generates the changelog from commits and merged pull requests,
updates `CHANGELOG.md` and `VERSION`, creates Git tags and publishes a GitHub
release.

Version rules:

- `feat:` or `feat(scope):` increments the minor version.
- `type!:`, `type(scope)!:` or `BREAKING CHANGE` increments the major version.
- Other changes increment the patch version.

Releases require the [GitHub CLI](https://cli.github.com/) authenticated with
GitHub and [`jq`](https://jqlang.org/). Start from an updated, clean `main`
branch with passing checks.

| Command | Result |
| --- | --- |
| `./release.sh --dry-run` | Preview the version and changelog without making changes |
| `./release.sh --local` | Update and commit the release files without pushing or tagging |
| `./release.sh` | Update and commit the release files, create the version and `latest` tags, push and publish the GitHub release |

Run `./release.sh --help` for the command reference.
