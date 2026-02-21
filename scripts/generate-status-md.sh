#!/usr/bin/env bash
set -euo pipefail

kind="${1:-}"

if [[ -z "${kind}" ]]; then
  echo "ERROR: Missing kind argument (fpm|cmake|meson)."
  exit 2
fi

case "${kind}" in
  fpm|cmake|meson) ;;
  *)
    echo "ERROR: Invalid kind '${kind}'. Expected: fpm|cmake|meson"
    exit 2
    ;;
esac

: "${GH_TOKEN:?ERROR: GH_TOKEN is not set.}"
: "${REPO:?ERROR: REPO is not set.}"
: "${RUN_ID:?ERROR: RUN_ID is not set.}"

VERSIONS_DIR="${VERSIONS_DIR:-}"

rank() {
  case "$1" in
    success) echo 1 ;;
    pending|""|null) echo 2 ;;
    cancelled) echo 3 ;;
    failure) echo 4 ;;
    skipped) echo 0 ;;
    *) echo 2 ;;
  esac
}

badge_style() {
  case "$1" in
    success)   echo "passing brightgreen" ;;
    failure)   echo "failing red" ;;
    cancelled) echo "cancelled lightgrey" ;;
    skipped)   echo "skipped lightgrey" ;;
    *)         echo "pending lightgrey" ;;
  esac
}

declare -A idx_to_version

if [[ -n "$VERSIONS_DIR" && -d "$VERSIONS_DIR" ]]; then
  while IFS= read -r d; do
    base="$(basename "$d")"

    if [[ "$base" =~ ^sfc-(macOS|Linux|Windows)-([^-]+)-([^-]+)-i([0-9]+)- ]]; then
      runner_os="${BASH_REMATCH[1]}"
      compiler="${BASH_REMATCH[2]}"
      version="${BASH_REMATCH[3]}"
      idx="i${BASH_REMATCH[4]}"

      os_key=""
      case "$runner_os" in
        Linux)   os_key="ubuntu-latest" ;;
        Windows) os_key="windows-latest" ;;
        macOS)   os_key="macos-latest" ;;
      esac

      compiler="${compiler//--/-}"

      if [[ -n "$os_key" && -n "$compiler" && -n "$version" ]]; then
        idx_to_version["${os_key},${compiler},${idx}"]="$version"
      fi
    fi
  done < <(find "$VERSIONS_DIR" -mindepth 1 -maxdepth 3 -type d 2>/dev/null || true)
fi

echo "Generating STATUS.md for test_${kind}..."

declare -A key_status

mapfile -t job_lines < <(
  curl -s -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs?per_page=200" \
    | jq -r --arg kind "${kind}" '
      .jobs[]
      | select((.name | type == "string") and (.name | test("_" + $kind + "$")))
      | [.name, (.conclusion // "pending")] | @tsv
    '
)

for line in "${job_lines[@]}"; do
  name="${line%%$'\t'*}"
  conclusion="${line#*$'\t'}"

  IFS='_' read -r os compiler idx kind2 <<< "$name"
  compiler="${compiler//--/-}"

  version="${idx_to_version[${os},${compiler},${idx}]:-Unknown}"

  if [[ "$version" == "Unknown" ]]; then
    continue
  fi

  key="${os}_${compiler}_${version}"

  prev="${key_status[$key]:-}"
  if [[ -z "$prev" ]]; then
    key_status[$key]="$conclusion"
  else
    if (( $(rank "$conclusion") > $(rank "$prev") )); then
      key_status[$key]="$conclusion"
    fi
  fi
done

badge_line=""

mapfile -t keys_sorted < <(printf "%s\n" "${!key_status[@]}" | sort)

for key in "${keys_sorted[@]}"; do
  conclusion="${key_status[$key]}"

  read -r label color < <(badge_style "$conclusion")

  safe_key="${key//-/--}"

  badge="![${key}](https://img.shields.io/badge/${safe_key}-${label}-${color})"
  badge_line="${badge_line} ${badge}"
done

echo "${badge_line# }" > STATUS.md

outdir="status-${kind}"
mkdir -p "${outdir}"
mv STATUS.md "${outdir}/STATUS.md"
cat "${outdir}/STATUS.md"