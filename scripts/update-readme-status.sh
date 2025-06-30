#!/bin/bash

README_FILE="README.md"
TMP_FPM="status_fpm.tmp"
TMP_CMAKE="status_cmake.tmp"

# Remote URLs
# Dynamic remote URLs for any GitHub repo
REPO="${GITHUB_REPOSITORY:-gha3mi/setup-fortran-conda}"
RAW_BASE="https://raw.githubusercontent.com/${REPO}"

URL_FPM="${RAW_BASE}/status-fpm/STATUS.md"
URL_CMAKE="${RAW_BASE}/status-cmake/STATUS.md"

# Flags for file availability
HAS_FPM=false
HAS_CMAKE=false

# Try downloading STATUS.md files
if curl -s --fail "$URL_FPM" -o "$TMP_FPM"; then
  HAS_FPM=true
fi

if curl -s --fail "$URL_CMAKE" -o "$TMP_CMAKE"; then
  HAS_CMAKE=true
fi

# Declare maps and sets
declare -A result
declare -A os_set
declare -A compiler_set

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
{
  # Header
  printf "| Compiler   "
  for os in "${all_os[@]}"; do
    label="${os_display[$os]:-$os}"
    printf "| %s " "$label"
  done
  echo "|"

  # Separator
  printf "|------------"
  for _ in "${all_os[@]}"; do
    printf "|----------------------"
  done
  echo "|"

  # Rows
  for compiler in "${all_compilers[@]}"; do
    printf "| \`%s\` " "$compiler"
    for os in "${all_os[@]}"; do
      cell="${result["$os,$compiler"]}"
      printf "| %s " "${cell:--}"
    done
    echo "|"
  done
} > "$TABLE_FILE"

# Inject table into README
awk -v start="<!-- STATUS:setup-fortran-conda:START -->" -v end="<!-- STATUS:setup-fortran-conda:END -->" -v table_file="$TABLE_FILE" '
  BEGIN { inject = 0 }
  $0 ~ start {
    print; system("cat " table_file); inject = 1; next
  }
  $0 ~ end { inject = 0 }
  !inject
' "$README_FILE" > README.new.md

mv README.new.md "$README_FILE"
rm -f "$TMP_FPM" "$TMP_CMAKE" "$TABLE_FILE"

echo "README.md updated with CI matrix based on actual badge coverage."
