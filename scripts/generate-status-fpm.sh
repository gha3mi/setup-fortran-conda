#!/bin/bash
echo "Generating STATUS.md for test_fpm..."
badge_line=""

mapfile -t job_lines < <(
    curl -s -H "Authorization: token $GH_TOKEN" \
    https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs?per_page=100 \
    | jq -r '.jobs[] | select((.name | type == "string") and (.name | test(".*_fpm$"))) | [.name, .conclusion] | @tsv'
)

for line in "${job_lines[@]}"; do
    name="${line%%$'\t'*}"
    conclusion="${line#*$'\t'}"

    os="${name%%_*}"
    compiler="${name#*_}"
    key="${os}_${compiler}"

    safe_key="${key//-/'--'}"

    if [[ "$conclusion" == "success" ]]; then
    color="brightgreen"
    label="passing"
    elif [[ "$conclusion" == "failure" ]]; then
    color="red"
    label="failing"
    elif [[ "$conclusion" == "cancelled" ]]; then
    color="lightgrey"
    label="cancelled"
    else
    color="lightgrey"
    label="pending"
    fi

    badge="![${key}](https://img.shields.io/badge/${safe_key}-${label}-${color})"
    badge_line="$badge_line $badge"
done

echo "$badge_line" > STATUS.md
mkdir -p status-fpm
mv STATUS.md status-fpm/STATUS.md
cat status-fpm/STATUS.md