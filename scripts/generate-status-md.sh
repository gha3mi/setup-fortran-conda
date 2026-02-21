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

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "ERROR: GH_TOKEN is not set."
  exit 2
fi
if [[ -z "${REPO:-}" ]]; then
  echo "ERROR: REPO is not set."
  exit 2
fi
if [[ -z "${RUN_ID:-}" ]]; then
  echo "ERROR: RUN_ID is not set."
  exit 2
fi

echo "Generating STATUS.md for test_${kind}..."
badge_line=""

mapfile -t job_lines < <(
  curl -s -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs?per_page=100" \
    | jq -r --arg kind "${kind}" \
      '.jobs[]
       | select((.name | type == "string") and (.name | test(".*_" + $kind + "$")))
       | [.name, .conclusion] | @tsv'
)

for line in "${job_lines[@]}"; do
  name="${line%%$'\t'*}"
  conclusion="${line#*$'\t'}"

  os="${name%%_*}"
  compiler="${name#*_}"
  key="${os}_${compiler}"

  safe_key="${key//-/'--'}"

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

outdir="status-${kind}"
mkdir -p "${outdir}"
mv STATUS.md "${outdir}/STATUS.md"
cat "${outdir}/STATUS.md"