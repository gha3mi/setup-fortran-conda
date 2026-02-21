#!/usr/bin/env bash
set -euo pipefail

kind="${1:-}"
[[ -n "$kind" ]] || { echo "ERROR: Missing kind argument." >&2; exit 2; }

case "$kind" in
  fpm|cmake|meson|mpi_fpm) ;;
  *) echo "ERROR: Invalid kind '$kind'." >&2; exit 2 ;;
esac

: "${GH_TOKEN:?ERROR: GH_TOKEN is not set.}"
: "${REPO:?ERROR: REPO is not set.}"
: "${RUN_ID:?ERROR: RUN_ID is not set.}"
: "${VERSIONS_DIR:?ERROR: VERSIONS_DIR is not set.}"

job_for_kind() {
  case "$1" in
    fpm) echo "test_fpm" ;;
    cmake) echo "test_cmake" ;;
    meson) echo "test_meson" ;;
    mpi_fpm) echo "test_mpi_fpm" ;;
  esac
}

rank() {
  case "$1" in
    failure) echo 5 ;;
    cancelled) echo 4 ;;
    pending|""|null) echo 3 ;;
    success) echo 2 ;;
    skipped) echo 1 ;;
    *) echo 3 ;;
  esac
}

badge_style() {
  case "$1" in
    success) echo "passing brightgreen" ;;
    failure) echo "failing red" ;;
    cancelled) echo "cancelled lightgrey" ;;
    skipped) echo "skipped lightgrey" ;;
    pending|""|null|*) echo "pending lightgrey" ;;
  esac
}

encode_segment() {
  local s="$1"
  s="${s//-/--}"
  s="${s// /_}"
  echo "$s"
}

job_kind="$(job_for_kind "$kind")"

declare -A version_by

while IFS= read -r f; do
  os="$(jq -r '.os // empty' "$f" 2>/dev/null || true)"
  compiler="$(jq -r '.compiler // empty' "$f" 2>/dev/null || true)"
  req="$(jq -r '.requested_compiler_version // ""' "$f" 2>/dev/null || echo "")"
  cver="$(jq -r '.compiler_version // .version // empty' "$f" 2>/dev/null || true)"
  job="$(jq -r '.job // empty' "$f" 2>/dev/null || true)"

  [[ -n "$os" && -n "$compiler" && -n "$cver" ]] || continue
  [[ "$cver" != "Unknown" ]] || continue
  [[ "$job" == "$job_kind" ]] || continue

  compiler="${compiler//--/-}"
  version_by["$os,$compiler,$req"]="$cver"
done < <(find "$VERSIONS_DIR" -type f -name '*.json' 2>/dev/null || true)

mapfile -t job_lines < <(
  curl -fsSL -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs?per_page=200" \
  | jq -r --arg kind "$kind" '
      .jobs[]
      | select((.name | type == "string") and (.name | test("_" + $kind + "$")))
      | [.name, (.conclusion // "pending")] | @tsv
    '
)

parse_job() {
  local name="$1"
  local tool=""
  if [[ "$name" =~ _mpi_fpm$ ]]; then tool="mpi_fpm"; name="${name%_mpi_fpm}"; else tool="${name##*_}"; name="${name%_*}"; fi
  local os="${name%%_*}"
  local rest="${name#*_}"
  local compiler="${rest%%_*}"
  local req="${rest#*_}"
  compiler="${compiler//--/-}"
  printf "%s\t%s\t%s\t%s\n" "$os" "$compiler" "$req" "$tool"
}

declare -A key_status

for line in "${job_lines[@]}"; do
  name="${line%%$'\t'*}"
  conclusion="${line#*$'\t'}"
  [[ -n "${conclusion:-}" && "$conclusion" != "null" ]] || conclusion="pending"

  parsed="$(parse_job "$name" 2>/dev/null || true)"
  [[ -n "$parsed" ]] || continue

  os="$(echo "$parsed" | cut -f1)"
  compiler="$(echo "$parsed" | cut -f2)"
  req="$(echo "$parsed" | cut -f3)"
  tool="$(echo "$parsed" | cut -f4)"

  [[ "$tool" == "$kind" ]] || continue

  resolved="${version_by[$os,$compiler,$req]:-Unknown}"
  [[ "$resolved" != "Unknown" ]] || continue

  key="$os,$compiler,$resolved,$tool"
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
  IFS=',' read -r os compiler version tool <<< "$key"
  conclusion="${key_status[$key]}"
  read -r label color < <(badge_style "$conclusion")
  left="${os}_${compiler}_${version}_${tool}"
  left_enc="$(encode_segment "$left")"
  badge="![${os} ${compiler} ${version} ${tool}]"
  badge="${badge}(https://img.shields.io/badge/${left_enc}-${label}-${color})"
  badge_line="${badge_line} ${badge}"
done

echo "${badge_line# }" > STATUS.md
outdir="status-${kind}"
mkdir -p "$outdir"
mv STATUS.md "$outdir/STATUS.md"
cat "$outdir/STATUS.md"