#!/usr/bin/env bash
set -euo pipefail

# REQUIRE: GH_TOKEN (i.e. GH_PAT), REPO, RUN_ID
if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "::error::GH_TOKEN is not set. Pass secrets.GH_PAT as env.GH_TOKEN"
  exit 1
fi
if [[ -z "${REPO:-}" || -z "${RUN_ID:-}" ]]; then
  echo "::error::REPO and RUN_ID must be set"
  exit 1
fi

MARKER_START="<!-- STATUS:setup-fortran-conda2:START -->"
MARKER_END="<!-- STATUS:setup-fortran-conda2:END -->"

echo "Fetching compiler versions from workflow run $RUN_ID in $REPO"

# Fetch all job IDs in the workflow run
job_ids=$(gh api "repos/$REPO/actions/runs/$RUN_ID/jobs" --paginate -q '.jobs[].id')

# Collect version rows from job logs
declare -A seen_versions
version_rows=()

for job_id in $job_ids; do
  log=$(gh api "repos/$REPO/actions/jobs/$job_id/logs" -H "Authorization: token $GH_TOKEN" --silent || true)
  matches=$(grep "::notice title=compiler-version::" <<< "$log" || true)

  while IFS= read -r line; do
    row=$(echo "$line" | sed 's/.*::notice title=compiler-version:://')
    key=$(echo "$row" | tr -d '[:space:]')
    if [[ -z "${seen_versions[$key]:-}" ]]; then
      seen_versions["$key"]=1
      version_rows+=("$row")
    fi
  done <<< "$matches"
done

if [[ ${#version_rows[@]} -eq 0 ]]; then
  echo "::warning::No compiler-version notices found in job logs."
  exit 0
fi

# Build markdown table
table="## Compiler Versions

| Platform | Compiler | Version |
|----------|----------|---------|"

for row in "${version_rows[@]}"; do
  table+=$'\n'"$row"
done

block="$MARKER_START
$table
$MARKER_END"

# Inject or append into README.md
if grep -q "$MARKER_START" README.md && grep -q "$MARKER_END" README.md; then
  awk -v start="$MARKER_START" -v end="$MARKER_END" -v block="$block" '
    $0 == start { print block; skip=1; next }
    $0 == end { skip=0; next }
    !skip
  ' README.md > README.tmp && mv README.tmp README.md
else
  echo -e "\n$block" >> README.md
fi

echo "✅ Compiler version table injected into README.md"
