#!/bin/bash

README_FILE="README.md"
TMP_FPM="status_fpm.tmp"
TMP_CMAKE="status_cmake.tmp"
TMP_MESON="status_meson.tmp"

GH_TOKEN="${GH_TOKEN:-}"
REPO="${REPO:-${GITHUB_REPOSITORY}}"
RUN_ID="${RUN_ID:-${GITHUB_RUN_ID}}"

# Remote URLs
REPO_FALLBACK="${GITHUB_REPOSITORY:-gha3mi/setup-fortran-conda}"
RAW_BASE="https://raw.githubusercontent.com/${REPO_FALLBACK}"

URL_FPM="${RAW_BASE}/status-fpm/STATUS.md"
URL_CMAKE="${RAW_BASE}/status-cmake/STATUS.md"
URL_MESON="${RAW_BASE}/status-meson/STATUS.md"

# Flags for file availability
HAS_FPM=false
HAS_CMAKE=false
HAS_MESON=false

# Try downloading STATUS.md files
if curl -s --fail "$URL_FPM" -o "$TMP_FPM"; then
  HAS_FPM=true
fi

if curl -s --fail "$URL_CMAKE" -o "$TMP_CMAKE"; then
  HAS_CMAKE=true
fi

if curl -s --fail "$URL_MESON" -o "$TMP_MESON"; then
  HAS_MESON=true
fi

# Declare maps and sets
declare -A result
declare -A os_set
declare -A compiler_set
declare -A version_map

# Normalize and store versions
add_version() {
  local compiler="$1"
  local version="$2"

  local short_version
  short_version="$(printf "%s" "$version" | grep -Eo '[0-9]+(\.[0-9]+){1,3}' | head -n 1)"
  if [[ -z "$short_version" ]]; then
    short_version="$(printf "%s" "$version" | awk '{print $1}')"
  fi
  short_version="${short_version:-unknown}"

  if [[ -n "${version_map[$compiler]}" && "${version_map[$compiler]}" != "$short_version" ]]; then
    version_map["$compiler"]="mixed"
  else
    version_map["$compiler"]="$short_version"
  fi
}

# Fetch compiler versions from job logs
fetch_versions_from_logs() {
  if [[ -z "$GH_TOKEN" || -z "$REPO" || -z "$RUN_ID" ]]; then
    return
  fi

  local jobs_json
  jobs_json="$(curl -s -H "Authorization: token $GH_TOKEN" \
    "https://api.github.com/repos/${REPO}/actions/runs/${RUN_ID}/jobs?per_page=100")"

  echo "$jobs_json" | jq -r '.jobs[] | [.id, .name] | @tsv' | while IFS=$'\t' read -r job_id job_name; do
    case "$job_name" in
      *_fpm|*_cmake|*_meson) ;;
      *) continue ;;
    esac

    local zipfile line payload compiler_from_log version_from_log
    zipfile="$(mktemp)"
    curl -sSL -H "Authorization: token $GH_TOKEN" \
      "https://api.github.com/repos/${REPO}/actions/jobs/${job_id}/logs" \
      -o "$zipfile"

    line="$(unzip -p "$zipfile" 2>/dev/null | grep -m1 'COMPILER_VERSION=')"
    rm -f "$zipfile"

    [[ -z "$line" ]] && continue
    payload="${line#*COMPILER_VERSION=}"
    compiler_from_log="${payload%%|*}"
    version_from_log="${payload#*|}"

    add_version "$compiler_from_log" "$version_from_log"
  done
}

fetch_versions_from_logs

# Parse status file
parse_status_file() {
  local file=$1

  for badge in $(cat "$file"); do
    key=$(echo "$badge" | sed -n 's/!\[\([^]]*\)\].*/\1/p')
    status=$(echo "$badge" | sed -n 's/.*-\(passing\|failing\|cancelled\|pending\)-.*/\1/p')
    [[ -z "$key" || -z "$status" ]] && continue

    IFS='_' read -r os compiler jobtype <<< "$key"
    compiler="${compiler//--/-}"

    os_set["$os"]=1
    compiler_set["$compiler"]=1

    icon="⏳"
    [[ $status == "passing" ]] && icon="✅"
    [[ $status == "failing" ]] && icon="❌"
    [[ $status == "cancelled" ]] && icon="🚫"

    cell="${result["$os,$compiler"]}"
    if [[ -n "$cell" ]]; then
      result["$os,$compiler"]="$cell  $jobtype $icon"
    else
      result["$os,$compiler"]="$jobtype $icon"
    fi
  done
}

# Conditionally parse available files
$HAS_FPM && parse_status_file "$TMP_FPM"
$HAS_CMAKE && parse_status_file "$TMP_CMAKE"
$HAS_MESON && parse_status_file "$TMP_MESON"

# Generate sorted arrays from sets
IFS=$'\n'
all_os=($(printf "%s\n" "${!os_set[@]}" | sort))
all_compilers=($(printf "%s\n" "${!compiler_set[@]}" | sort))
unset IFS

# Pretty display names for OS headers
declare -A os_display
os_display=(
  ["ubuntu-latest"]="ubuntu"
  ["macos-latest"]="macos"
  ["windows-latest"]="windows"
)

# Generate Markdown table
TABLE_FILE="status.matrix.table"
META_FILE="status.matrix.meta"
LAST_UPDATED="$(date -u +%F)"
echo "Last updated: ${LAST_UPDATED}" > "$META_FILE"

{
  # Header
  printf "| Compiler   | version "
  for os in "${all_os[@]}"; do
    label="${os_display[$os]:-$os}"
    printf "| %s " "$label"
  done
  echo "|"

  # Separator
  printf "|------------|---------"
  for _ in "${all_os[@]}"; do
    printf "|----------------------"
  done
  echo "|"

  # Rows
  for compiler in "${all_compilers[@]}"; do
    version="${version_map[$compiler]:-unknown}"
    printf "| \`%s\` | %s " "$compiler" "$version"
    for os in "${all_os[@]}"; do
      cell="${result["$os,$compiler"]}"
      printf "| %s " "${cell:--}"
    done
    echo "|"
  done
} > "$TABLE_FILE"

# Inject table into README
awk -v start="<!-- STATUS:setup-fortran-conda:START -->" -v end="<!-- STATUS:setup-fortran-conda:END -->" -v table_file="$TABLE_FILE" -v meta_file="$META_FILE" '
  BEGIN { inject = 0 }
  $0 ~ start {
    print; system("cat " table_file); system("cat " meta_file); inject = 1; next
  }
  $0 ~ end { inject = 0 }
  !inject
' "$README_FILE" > README.new.md

mv README.new.md "$README_FILE"
rm -f "$TMP_FPM" "$TMP_CMAKE" "$TMP_MESON" "$TABLE_FILE" "$META_FILE"

echo "README.md updated with CI matrix based on actual badge coverage."