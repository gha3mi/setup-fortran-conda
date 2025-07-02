#!/bin/bash

set -euo pipefail

README_FILE="README.md"
TMP_FPM="status_fpm.tmp"
TMP_CMAKE="status_cmake.tmp"
TABLE_FILE="status.matrix.table"
VERSIONS_FILE="status.versions.tmp"

# GitHub repo and raw URLs
REPO="${GITHUB_REPOSITORY:-gha3mi/setup-fortran-conda}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}"

URL_FPM="${RAW_BASE}/status-fpm/STATUS.md"
URL_CMAKE="${RAW_BASE}/status-cmake/STATUS.md"

HAS_FPM=false
HAS_CMAKE=false

# Download STATUS.md files if available
if curl -s --fail "$URL_FPM" -o "$TMP_FPM"; then
  HAS_FPM=true
fi

if curl -s --fail "$URL_CMAKE" -o "$TMP_CMAKE"; then
  HAS_CMAKE=true
fi

# Declare data structures
declare -A result
declare -A os_set
declare -A compiler_set

# Parse badges from a STATUS.md file
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

    cell="${result["$os,$compiler"]:-}"
    if [[ -n "$cell" ]]; then
      result["$os,$compiler"]="$cell  $jobtype $icon"
    else
      result["$os,$compiler"]="$jobtype $icon"
    fi
  done
}

# Parse available files
$HAS_FPM && parse_status_file "$TMP_FPM"
$HAS_CMAKE && parse_status_file "$TMP_CMAKE"

# Generate sorted OS and compiler lists
IFS=$'\n'
all_os=($(printf "%s\n" "${!os_set[@]}" | sort))
all_compilers=($(printf "%s\n" "${!compiler_set[@]}" | sort))
unset IFS

# Map OS labels
declare -A os_display=(
  ["ubuntu-latest"]="ubuntu"
  ["windows-latest"]="windows"
  ["macos-latest"]="macos"
)

# Generate status matrix table
{
  printf "| Compiler   "
  for os in "${all_os[@]}"; do
    label="${os_display[$os]:-$os}"
    printf "| %s " "$label"
  done
  echo "|"

  printf "|------------"
  for _ in "${all_os[@]}"; do
    printf "|----------------------"
  done
  echo "|"

  for compiler in "${all_compilers[@]}"; do
    printf "| \`%s\` " "$compiler"
    for os in "${all_os[@]}"; do
      cell="${result["$os,$compiler"]:-}"
      printf "| %s " "${cell:--}"
    done
    echo "|"
  done
} > "$TABLE_FILE"

# Generate tool version table
{
  echo -e "\n### Tool Versions\n"
  echo "| OS      | Compiler   | Version              | Tool     | Version     |"
  echo "|---------|------------|----------------------|----------|-------------|"

  for file in "$TMP_FPM" "$TMP_CMAKE"; do
    [[ -f "$file" ]] || continue

    awk '
      BEGIN {
        os=""; compiler=""; compiler_version=""; tool=""; tool_version=""; in_versions=0;
      }
      /^VERSIONS:/ { in_versions=1; next }
      in_versions && /^os=/ { os=substr($0, 4) }
      in_versions && /^compiler=/ { compiler=substr($0, 10) }
      in_versions && /^compiler_version=/ { compiler_version=substr($0, 18) }
      in_versions && /^tool=/ { tool=substr($0, 6) }
      in_versions && /^tool_version=/ { tool_version=substr($0, 13) }
      in_versions && NF == 0 {
        if (os && compiler && compiler_version && tool && tool_version) {
          printf "| %-7s | %-10s | %-20s | %-8s | %-10s |\n", os, compiler, compiler_version, tool, tool_version
        }
        os=compiler=compiler_version=tool=tool_version=""
        in_versions=0
      }
    ' "$file"
  done
} > "$VERSIONS_FILE"

# Inject both tables into README
awk -v start="<!-- STATUS:setup-fortran-conda:START -->" \
    -v end="<!-- STATUS:setup-fortran-conda:END -->" \
    -v table_file="$TABLE_FILE" \
    -v versions_file="$VERSIONS_FILE" '
  BEGIN { inject = 0 }
  $0 ~ start {
    print
    system("cat " table_file)
    system("cat " versions_file)
    inject = 1
    next
  }
  $0 ~ end { inject = 0 }
  !inject
' "$README_FILE" > README.new.md

mv README.new.md "$README_FILE"

# Clean up
rm -f "$TMP_FPM" "$TMP_CMAKE" "$TABLE_FILE" "$VERSIONS_FILE"

echo "✅ README.md updated with status matrix and per-compiler tool versions."
