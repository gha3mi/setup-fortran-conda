#!/usr/bin/env bash
set -e

VERSION_FILE=$(find "$RUNNER_TEMP" -name version-info.json | head -n 1)
MARKER_START="<!-- STATUS:setup-fortran-conda2:START -->"
MARKER_END="<!-- STATUS:setup-fortran-conda2:END -->"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "::error::version-info.json not found in $RUNNER_TEMP"
  exit 1
fi

platform=$(jq -r .platform "$VERSION_FILE")
compiler=$(jq -r .compiler "$VERSION_FILE")
version=$(jq -r .compiler_version "$VERSION_FILE")

TABLE=$(cat <<EOF
$MARKER_START
## Compiler Versions

| Platform | Compiler | Version |
|----------|----------|---------|
| $platform | $compiler | $version |
$MARKER_END
EOF
)

# Replace section between markers or append at the end
if grep -q "$MARKER_START" README.md && grep -q "$MARKER_END" README.md; then
  # Replace between the markers
  awk -v start="$MARKER_START" -v end="$MARKER_END" -v table="$TABLE" '
    $0 == start { print table; skip=1; next }
    $0 == end { skip=0; next }
    !skip
  ' README.md > README.tmp && mv README.tmp README.md
else
  # Append to the end
  echo -e "\n$TABLE" >> README.md
fi
