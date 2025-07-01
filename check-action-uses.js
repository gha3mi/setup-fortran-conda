// check-action-uses.js

import fs from 'fs';
import path from 'path';
import https from 'https';

const ACTION_YML = 'action.yml';

function getUsesLines(file) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /uses:\s+([\w.-]+\/[\w.-]+)@([\w.-]+)/g;
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push({ full: m[0], repo: m[1], version: m[2] });
  }
  return matches;
}

function getLatestTag(repo) {
  const url = `https://api.github.com/repos/${repo}/tags`;
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'dependabot-check-script',
            Accept: 'application/vnd.github.v3+json',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const tags = JSON.parse(data);
              resolve(tags[0]?.name || null);
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', reject);
  });
}

async function checkUsesVersions() {
  const file = path.resolve(ACTION_YML);
  if (!fs.existsSync(file)) {
    console.error(`❌ ${ACTION_YML} not found`);
    process.exit(1);
  }

  const usesLines = getUsesLines(file);

  if (usesLines.length === 0) {
    console.log(`✅ No 'uses:' lines found in ${ACTION_YML}`);
    return;
  }

  for (const { repo, version } of usesLines) {
    try {
      const latest = await getLatestTag(repo);
      if (!latest) {
        console.warn(`⚠️  No tags found for ${repo}`);
        continue;
      }
      if (version !== latest) {
        console.log(`🔄 ${repo}: ${version} → ${latest}`);
      } else {
        console.log(`✅ ${repo} is up to date (${version})`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch tags for ${repo}: ${err.message}`);
    }
  }
}

checkUsesVersions();
