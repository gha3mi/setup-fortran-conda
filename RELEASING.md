# Releasing

`release.sh` calculates a semantic version bump from merged pull requests and
commits, updates `CHANGELOG.md` and `VERSION`, creates Git tags and publishes a
GitHub release.

## Requirements

- [GitHub CLI](https://cli.github.com/) installed and authenticated
- [`jq`](https://jqlang.org/) installed

## Preview

Run a dry run before creating a release:

```bash
./release.sh --dry-run
```

This previews the version bump and changelog without modifying files or
publishing anything.

## Local release

```bash
./release.sh --local
```

This updates `CHANGELOG.md` and `VERSION` and commits the changes locally. It
does not push, tag or publish a GitHub release.

## Publish

```bash
./release.sh
```

This updates and commits the release files, creates the version and `latest`
tags, pushes the changes and publishes the GitHub release.

Run `./release.sh --help` for the command reference.
