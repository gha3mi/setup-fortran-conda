#!/bin/bash

# Define source and target
STATUS_URL="https://raw.githubusercontent.com/gha3mi/setup-fortran-conda/gh-pages-status/STATUS.md"
README_FILE="README.md"

# Download STATUS.md to a temp file
curl -s "$STATUS_URL" -o status.tmp

# Insert it into README.md at a specific placeholder
awk '
  BEGIN { injected = 0 }
  /^<!-- STATUS:START -->/ {
    print; system("cat status.tmp"); injected = 1; next
  }
  /^<!-- STATUS:END -->/ {
    injected = 0
  }
  !injected
' "$README_FILE" >README.new.md

mv README.new.md "$README_FILE"
rm status.tmp

echo "README.md updated with STATUS.md content."
