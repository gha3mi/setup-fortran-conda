#!/bin/bash
set -euo pipefail

README_FILE="README.md"
JOBS_FILE="${JOBS_FILE:-.ci/jobs.json}"
VERSIONS_FILE="${VERSIONS_FILE:-.ci/versions.json}"

declare -A result
declare -A os_set
declare -A compiler_set

LAST_UPDATED="$(date -u +%F)"
if [[ -f "$VERSIONS_FILE" ]]; then
  vdate="$(jq -r '.generated_at // empty' "$VERSIONS_FILE" 2>/dev/null || true)"
  [[ -n "$vdate" && "$vdate" != "null" ]] && LAST_UPDATED="$vdate"
fi

get_ver() {
  local c="$1"
  if [[ -f "$VERSIONS_FILE" ]]; then
    jq -r --arg c "$c" '."fortran-compilers"[$c] // "Unknown"' "$VERSIONS_FILE" 2>/dev/null || echo "Unknown"
  else
    echo "Unknown"
  fi
}

mapfile -t rows < <(
  jq -r '
    .jobs[]
    | select(.name | test("_(fpm|cmake|meson|mpi_fpm)$"))
    | [.name, (.conclusion // "pending")]
    | @tsv
  ' "$JOBS_FILE"
)

for line in "${rows[@]}"; do
  name="${line%%$'\t'*}"
  status="${line#*$'\t'}"

  IFS='_' read -r os compiler jobtype <<< "$name"
  compiler="${compiler//--/-}"

  os_set["$os"]=1
  compiler_set["$compiler"]=1

  icon="⏳"
  [[ $status == "success" ]] && icon="✅"
  [[ $status == "failure" ]] && icon="❌"
  [[ $status == "cancelled" ]] && icon="🚫"
  [[ $status == "skipped" ]] && icon="–"

  cell="${result["$os,$compiler"]:-}"
  if [[ -n "$cell" ]]; then
    result["$os,$compiler"]="$cell  $jobtype $icon"
  else
    result["$os,$compiler"]="$jobtype $icon"
  fi
done

IFS=$'\n'
all_os=($(printf "%s\n" "${!os_set[@]}" | sort))
all_compilers=($(printf "%s\n" "${!compiler_set[@]}" | sort))
unset IFS

declare -A os_display=(
  ["ubuntu-latest"]="ubuntu"
  ["macos-latest"]="macos"
  ["windows-latest"]="windows"
)

TABLE_FILE="status.matrix.table"
{
  printf "| Compiler | version "
  for os in "${all_os[@]}"; do
    label="${os_display[$os]:-$os}"
    printf "| %s " "$label"
  done
  echo "|"

  printf "|----------|---------"
  for _ in "${all_os[@]}"; do
    printf "|----------------------"
  done
  echo "|"

  for compiler in "${all_compilers[@]}"; do
    ver="$(get_ver "$compiler")"
    printf "| \`%s\` | %s " "$compiler" "$ver"
    for os in "${all_os[@]}"; do
      cell="${result["$os,$compiler"]:-}"
      printf "| %s " "${cell:--}"
    done
    echo "|"
  done

  echo ""
  echo "Last updated: ${LAST_UPDATED}"
} > "$TABLE_FILE"

awk -v start="<!-- STATUS:setup-fortran-conda:START -->" \
    -v end="<!-- STATUS:setup-fortran-conda:END -->" \
    -v table_file="$TABLE_FILE" '
  BEGIN { inject = 0 }
  $0 ~ start { print; system("cat " table_file); inject = 1; next }
  $0 ~ end { inject = 0 }
  !inject
' "$README_FILE" > README.new.md

mv README.new.md "$README_FILE"
rm -f "$TABLE_FILE"

echo "README.md updated with CI matrix from live workflow + compiler versions."
