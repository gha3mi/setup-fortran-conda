#!/bin/bash
set -euo pipefail

README_FILE="README.md"
JOBS_FILE="${JOBS_FILE:-.ci/jobs.json}"
VERSIONS_FILE="${VERSIONS_FILE:-.ci/versions.json}"
VERSIONS_DIR="${VERSIONS_DIR:-${RUNNER_TEMP:-/tmp}/sfc_ci/sfc_versions}"

LAST_UPDATED="$(date -u +%F)"
if [[ -f "$VERSIONS_FILE" ]]; then
  vdate="$(jq -r '.generated_at // empty' "$VERSIONS_FILE" 2>/dev/null || true)"
  [[ -n "$vdate" && "$vdate" != "null" ]] && LAST_UPDATED="$vdate"
fi

OS_KEYS=("macos-latest" "ubuntu-latest" "windows-latest")

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

declare -A idx_to_version


if [[ -d "$VERSIONS_DIR" ]]; then
  while IFS= read -r d; do
    base="$(basename "$d")"

    if [[ "$base" =~ ^sfc-(macOS|Linux|Windows)-([^-]+)-([^-]+)-i([0-9]+)- ]]; then
      runner_os="${BASH_REMATCH[1]}"
      compiler="${BASH_REMATCH[2]}"
      version="${BASH_REMATCH[3]}"
      idx="i${BASH_REMATCH[4]}"

      os_key=""
      case "$runner_os" in
        Linux) os_key="ubuntu-latest" ;;
        Windows) os_key="windows-latest" ;;
        macOS) os_key="macos-latest" ;;
      esac

      compiler="${compiler//--/-}"

      if [[ -n "$os_key" && -n "$compiler" && -n "$version" && -n "$idx" ]]; then
        idx_to_version["${os_key},${compiler},${idx}"]="$version"
      fi
    fi
  done < <(find "$VERSIONS_DIR" -mindepth 1 -maxdepth 3 -type d 2>/dev/null || true)
fi

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

  IFS='_' read -r os compiler idx jobtype <<< "$name"
  compiler="${compiler//--/-}"

  [[ "$idx" =~ ^i[0-9]+$ ]] || continue

  key="${os},${compiler},${idx},${jobtype}"
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
  echo "ERROR: No versions found in $VERSIONS_FILE (rows[]). Cannot build version-only table." >&2
  exit 2
fi

build_cell() {
  local os="$1"
  local compiler="$2"
  local version="$3"
  local parts=()
  local t st worst ic
  local idx resolved key

  for t in fpm cmake meson mpi_fpm; do
    worst=""

    for k in "${!idx_to_version[@]}"; do
      IFS=',' read -r kos kcomp kidx <<< "$k"
      [[ "$kos" == "$os" && "$kcomp" == "$compiler" ]] || continue

      resolved="${idx_to_version[$k]}"
      [[ "$resolved" == "$version" ]] || continue

      key="${os},${compiler},${kidx},${t}"
      st="${best_status[$key]:-}"
      [[ -n "$st" ]] || continue

      if [[ -z "$worst" ]]; then
        worst="$st"
      else
        if (( $(rank "$st") > $(rank "$worst") )); then
          worst="$st"
        fi
      fi
    done

    if [[ -n "$worst" ]]; then
      ic="$(icon "$worst")"
      parts+=("${t} ${ic}")
    fi
  done

  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "–"
  else
    local out=""
    for p in "${parts[@]}"; do
      [[ -z "$out" ]] && out="$p" || out="$out  $p"
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
      cell="$(build_cell "$os" "$compiler" "$version")"
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