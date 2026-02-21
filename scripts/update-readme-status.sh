#!/bin/bash
set -euo pipefail

README_FILE="README.md"
JOBS_FILE="${JOBS_FILE:-.ci/jobs.json}"
VERSIONS_FILE="${VERSIONS_FILE:-.ci/versions.json}"

START_MARK="<!-- STATUS:setup-fortran-conda:START -->"
END_MARK="<!-- STATUS:setup-fortran-conda:END -->"

OS_KEYS=("macos-latest" "ubuntu-latest" "windows-latest")
TOOLS=("fpm" "cmake" "meson" "mpi_fpm")

icon() {
  case "$1" in
    success) echo "✅" ;;
    failure) echo "❌" ;;
    cancelled) echo "🚫" ;;
    skipped) echo "–" ;;
    pending|""|null|*) echo "⏳" ;;
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

parse_job_name() {
  local name="$1"
  local tool=""
  if [[ "$name" =~ _mpi_fpm$ ]]; then
    tool="mpi_fpm"
    name="${name%_mpi_fpm}"
  else
    tool="${name##*_}"
    name="${name%_*}"
  fi

  local os="${name%%_*}"
  local rest="${name#*_}"
  local compiler="${rest%%_*}"
  local req="${rest#*_}"

  compiler="${compiler//--/-}"
  printf "%s\t%s\t%s\t%s\n" "$os" "$compiler" "$req" "$tool"
}

if [[ ! -f "$README_FILE" ]]; then echo "ERROR: $README_FILE not found" >&2; exit 2; fi
if [[ ! -f "$JOBS_FILE" ]]; then echo "ERROR: JOBS_FILE not found: $JOBS_FILE" >&2; exit 2; fi
if [[ ! -f "$VERSIONS_FILE" ]]; then echo "ERROR: VERSIONS_FILE not found: $VERSIONS_FILE" >&2; exit 2; fi

LAST_UPDATED="$(date -u +%F)"
vdate="$(jq -r '.generated_at // empty' "$VERSIONS_FILE" 2>/dev/null || true)"
[[ -n "$vdate" && "$vdate" != "null" ]] && LAST_UPDATED="$vdate"

declare -A status_by_req
while IFS=$'\t' read -r name conclusion; do
  parsed="$(parse_job_name "$name" 2>/dev/null || true)"
  [[ -n "$parsed" ]] || continue

  os="$(echo "$parsed" | cut -f1)"
  compiler="$(echo "$parsed" | cut -f2)"
  req="$(echo "$parsed" | cut -f3)"
  tool="$(echo "$parsed" | cut -f4)"

  [[ -n "${conclusion:-}" && "$conclusion" != "null" ]] || conclusion="pending"
  status_by_req["$os|$compiler|$tool|$req"]="$conclusion"
done < <(
  jq -r '
    .jobs[]
    | select(.name | test("_(fpm|cmake|meson|mpi_fpm)$"))
    | [.name, (.conclusion // "pending")]
    | @tsv
  ' "$JOBS_FILE"
)

declare -A cell_status
while IFS=$'\t' read -r os compiler tool req cver; do
  [[ -n "$os" && -n "$compiler" && -n "$tool" && -n "$cver" && "$cver" != "Unknown" ]] || continue
  compiler="${compiler//--/-}"

  st="${status_by_req["$os|$compiler|$tool|$req"]:-pending}"

  key="$os|$compiler|$tool|$cver"
  prev="${cell_status[$key]:-}"
  if [[ -z "$prev" || $(rank "$st") -gt $(rank "$prev") ]]; then
    cell_status[$key]="$st"
  fi
done < <(
  jq -r '
    .entries[]?
    | [
        (.os // ""),
        (.compiler // ""),
        (.tool // ""),
        (.requested_compiler_version // ""),
        (.compiler_version // .version // "")
      ]
    | @tsv
  ' "$VERSIONS_FILE"
)

mapfile -t compver_rows < <(
  jq -r '.rows[]? | [.compiler, .compiler_version] | @tsv' "$VERSIONS_FILE"
)

if [[ ${#compver_rows[@]} -eq 0 ]]; then
  echo "ERROR: No rows found in $VERSIONS_FILE (.rows[] empty)." >&2
  exit 2
fi

build_cell() {
  local os="$1"
  local compiler="$2"
  local version="$3"

  local parts=()
  local tool st

  for tool in "${TOOLS[@]}"; do
    st="${cell_status["$os|$compiler|$tool|$version"]:-}"
    [[ -n "$st" ]] || continue

    label="$tool"
    [[ "$tool" == "mpi_fpm" ]] && label="mpi"

    parts+=("${label} $(icon "$st")")
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
  echo "| compiler | version | macos | ubuntu | windows |"
  echo "|---------:|:--------|:------|:-------|:--------|"

  IFS=$'\n' sorted=($(printf "%s\n" "${compver_rows[@]}" | sort))
  unset IFS

  for row in "${sorted[@]}"; do
    compiler="${row%%$'\t'*}"
    version="${row#*$'\t'}"

    printf "| \`%s\` | %s " "$compiler" "$version"
    for os in "${OS_KEYS[@]}"; do
      printf "| %s " "$(build_cell "$os" "$compiler" "$version")"
    done
    echo "|"
  done

  echo ""
  echo "Last updated: ${LAST_UPDATED}"
} > "$TABLE_FILE"

awk -v start="$START_MARK" -v end="$END_MARK" -v table_file="$TABLE_FILE" '
  BEGIN { inject = 0 }
  $0 ~ start { print; system("cat " table_file); inject = 1; next }
  $0 ~ end { inject = 0; print; next }
  !inject { print }
' "$README_FILE" > README.new.md

mv README.new.md "$README_FILE"
rm -f "$TABLE_FILE"