#!/bin/bash
set -euo pipefail

README_FILE="README.md"
JOBS_FILE="${JOBS_FILE:-.ci/jobs.json}"
VERSIONS_FILE="${VERSIONS_FILE:-.ci/versions.json}"

LAST_UPDATED="$(date -u +%F)"
if [[ -f "$VERSIONS_FILE" ]]; then
  vdate="$(jq -r '.generated_at // empty' "$VERSIONS_FILE" 2>/dev/null || true)"
  [[ -n "$vdate" && "$vdate" != "null" ]] && LAST_UPDATED="$vdate"
fi

OS_KEYS=("macos-latest" "ubuntu-latest" "windows-latest")
declare -A os_display=(
  ["ubuntu-latest"]="ubuntu"
  ["macos-latest"]="macos"
  ["windows-latest"]="windows"
)

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

icon() {
  case "$1" in
    success) echo "✅" ;;
    failure) echo "❌" ;;
    cancelled) echo "🚫" ;;
    skipped) echo "–" ;;
    pending|""|null|*) echo "⏳" ;;
  esac
}

declare -A best_status

mapfile -t job_lines < <(
  jq -r '
    .jobs[]
    | select(.name | test("_(fpm|cmake|meson|mpi_fpm)$"))
    | [.name, (.conclusion // "pending")]
    | @tsv
  ' "$JOBS_FILE"
)

for line in "${job_lines[@]}"; do
  name="${line%%$'\t'*}"
  status="${line#*$'\t'}"

  IFS='_' read -r os compiler jobtype <<< "$name"
  compiler="${compiler//--/-}"

  key="${os},${compiler},${jobtype}"
  prev="${best_status[$key]:-}"

  if [[ -z "$prev" ]]; then
    best_status[$key]="$status"
  else
    if (( $(rank "$status") > $(rank "$prev") )); then
      best_status[$key]="$status"
    fi
  fi
done

declare -a comp_ver_rows
if [[ -f "$VERSIONS_FILE" ]]; then
  mapfile -t comp_ver_rows < <(
    jq -r '.rows[]? | [.compiler, .version] | @tsv' "$VERSIONS_FILE" 2>/dev/null || true
  )
fi

if [[ ${#comp_ver_rows[@]} -eq 0 ]]; then
  mapfile -t compilers < <(
    jq -r '.jobs[] | select(.name | test("_(fpm|cmake|meson|mpi_fpm)$")) | .name' "$JOBS_FILE" \
      | awk -F'_' '{print $2}' | sed 's/--/-/g' | sort -u
  )
  for c in "${compilers[@]}"; do
    comp_ver_rows+=("${c}"$'\t'"Unknown")
  done
fi

build_cell() {
  local os="$1"
  local compiler="$2"
  local parts=()
  local t st ic

  for t in fpm cmake meson mpi_fpm; do
    st="${best_status[${os},${compiler},${t}]:-}"
    if [[ -n "$st" ]]; then
      ic="$(icon "$st")"
      parts+=("${t} ${ic}")
    fi
  done

  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "–"
  else
    local out=""
    for p in "${parts[@]}"; do
      if [[ -z "$out" ]]; then out="$p"; else out="$out  $p"; fi
    done
    echo "$out"
  fi
}

TABLE_FILE="status.matrix.table"
{
  echo "| compiler   | version | macos | ubuntu | windows |"
  echo "|------------|---------|-------|--------|---------|"

  IFS=$'\n' sorted_rows=($(printf "%s\n" "${comp_ver_rows[@]}" | sort))
  unset IFS

  for row in "${sorted_rows[@]}"; do
    compiler="${row%%$'\t'*}"
    version="${row#*$'\t'}"

    printf "| \`%s\` | %s " "$compiler" "$version"

    for os in "${OS_KEYS[@]}"; do
      cell="$(build_cell "$os" "$compiler")"
      printf "| %s " "$cell"
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

echo "README.md updated with CI matrix table."