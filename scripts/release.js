// release.js
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { Octokit } from "@octokit/rest";
import path from "path";

const GH_TOKEN = process.env.GH_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const ACTOR = process.env.GITHUB_ACTOR;
const BRANCH = process.env.RELEASE_BRANCH || "main";

if (!GH_TOKEN || !GITHUB_REPOSITORY) {
  console.error("Missing GH_TOKEN or GITHUB_REPOSITORY.");
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split("/");
const octokit = new Octokit({ auth: GH_TOKEN });

function exec(cmd, options = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf-8", ...options }).trim();
}

// Clone the repo (shallow=false) and enter it
function checkoutRepository() {
  const cwd = process.cwd();
  console.log(`Using already checked-out repository: ${cwd}`);
  exec(`git config --global --add safe.directory "${cwd}"`);
}


function getPreviousTag() {
  try {
    exec("git fetch --tags");
    const tag = exec("git tag --sort=-v:refname | grep '^v' | head -n1");
    return tag || "v0.0.0";
  } catch {
    return "v0.0.0";
  }
}

function determineNextTag(prevTag) {
  const commits = exec(`git log ${prevTag}..HEAD --pretty=format:"%s"`);

  console.log(`Commits since ${prevTag}:\n${commits || "(none)"}`);
  if (!commits) return null;

  let bump = "patch";
  if (/^feat(\(.+\))?!?: |^feat: /m.test(commits)) bump = "minor";
  if (/BREAKING CHANGE|!:/m.test(commits)) bump = "major";

  const [major, minor, patch] = prevTag.replace(/^v/, "").split(".").map(Number);
  if ([major, minor, patch].some(n => isNaN(n))) return "v1.0.0";

  let nextTag;
  if (bump === "major") nextTag = `v${major + 1}.0.0`;
  else if (bump === "minor") nextTag = `v${major}.${minor + 1}.0`;
  else nextTag = `v${major}.${minor}.${patch + 1}`;

  return nextTag;
}

async function generateChangelog(prevTag, nextTag) {
  const date = new Date().toISOString().split("T")[0];
  const repoUrl = `https://github.com/${owner}/${repo}`;

  const compare = await octokit.repos.compareCommits({ owner, repo, base: prevTag, head: "HEAD" });
  const commits = compare.data.commits;
  const commitShas = new Set(commits.map(c => c.sha));

  const prs = await octokit.paginate(octokit.pulls.list, {
    owner, repo, state: "closed", per_page: 100,
  });

  const matchedPRs = [];
  const prCommitShas = new Set();
  for (const pr of prs) {
    if (!pr.merged_at) continue;
    const prCommits = await octokit.paginate(octokit.pulls.listCommits, {
      owner, repo, pull_number: pr.number
    });
    const hasMatch = prCommits.some(c => commitShas.has(c.sha));
    if (hasMatch) {
      matchedPRs.push(pr);
      prCommits.forEach(c => prCommitShas.add(c.sha));
    }
  }

  const groups = {
    features: [], fixes: [], breaking: [], others: [], contributors: new Set()
  };

  const classify = (msg, line) => {
    if (/^feat(\([^)]+\))?!?: |^feat: /.test(msg)) groups.features.push(line);
    else if (/^fix(\([^)]+\))?!?: |^fix: /.test(msg)) groups.fixes.push(line);
    else if (/BREAKING CHANGE|!:/.test(msg)) groups.breaking.push(line);
    else groups.others.push(line);
  };

  for (const pr of matchedPRs) {
    if (/^docs: update CHANGELOG for v/i.test(pr.title)) continue;
    const line = `* ${pr.title} ([#${pr.number}](${repoUrl}/pull/${pr.number})) by @${pr.user.login}`;
    classify(pr.title, line);
    groups.contributors.add(pr.user.login);
  }

  for (const c of commits) {
    if (prCommitShas.has(c.sha)) continue;
    const msg = c.commit.message.split("\n")[0];
    if (/^docs: update CHANGELOG for v/i.test(msg)) continue;
    const author = c.author?.login || c.commit.author.name;
    const line = `* ${msg} ([${c.sha.slice(0, 7)}](${repoUrl}/commit/${c.sha})) by @${author}`;
    classify(msg, line);
    groups.contributors.add(author);
  }

  const section = (title, lines) =>
    lines.length > 0 ? `### ${title}\n${lines.join("\n")}\n\n` : "";

  let changelogEntry = `# [${nextTag.replace(/^v/, "")}](${repoUrl}/compare/${prevTag}...${nextTag}) (${date})\n\n`;
  changelogEntry += section("Features", groups.features);
  changelogEntry += section("Fixes", groups.fixes);
  changelogEntry += section("Breaking Changes", groups.breaking);
  changelogEntry += section("Others", groups.others);
  if (groups.contributors.size > 0) {
    changelogEntry += `### Contributors\n${[...groups.contributors].sort().map(u => `- @${u}`).join("\n")}\n\n`;
  }
  changelogEntry += `Full Changelog: [${prevTag}...${nextTag}](${repoUrl}/compare/${prevTag}...${nextTag})\n`;

  const existing = existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : "";
  writeFileSync("CHANGELOG.md", `${changelogEntry}\n\n${existing}`);
  writeFileSync("VERSION", nextTag.replace(/^v/, ""));
  return changelogEntry;
}

function commitAndPush(file, message) {
  exec(`git add ${file}`);
  try {
    exec(`git commit -m "${message}"`);
    exec(`git push origin ${BRANCH}`);
  } catch {
    console.log(`No changes in ${file}`);
  }
}

function wasCommitted(pattern) {
  try {
    const message = exec("git log -1 --pretty=%B");
    return new RegExp(pattern).test(message);
  } catch {
    return false;
  }
}

function createTag(tag) {
  try {
    exec(`git rev-parse ${tag}`);
    console.log(`Tag already exists: ${tag}`);
  } catch {
    exec(`git tag ${tag}`);
    exec(`git push origin ${tag}`);
  }
}

function updateLatestTag(tag) {
  exec(`git fetch --tags`);
  exec(`git tag -f latest ${tag}`);
  exec(`git push origin -f latest`);
}

async function createGitHubRelease(tag, changelog) {
  await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: changelog,
  });
}

// --- Main Execution ---
(async () => {
  checkoutRepository();

  try {
    exec("git config user.name", { stdio: "ignore" });
  } catch {
    exec(`git config user.name "${ACTOR}"`);
    exec(`git config user.email "${ACTOR}@users.noreply.github.com"`);
  }

  const prevTag = getPreviousTag();
  console.log(`Previous tag: ${prevTag}`);

  const nextTag = determineNextTag(prevTag);
  if (!nextTag) {
    console.log("No new commits since last release. Skipping.");
    return;
  }

  console.log(`Next version tag: ${nextTag}`);

  const changelog = await generateChangelog(prevTag, nextTag);
  console.log("Generated changelog.");

  exec("git add CHANGELOG.md VERSION");
  try {
    exec(`git commit -m "chore: release ${nextTag}\n\ndocs: update CHANGELOG\nchore: update VERSION"`);
    exec(`git push origin ${BRANCH}`);
  } catch {
    console.log("No changes to commit.");
  }

  createTag(nextTag);
  updateLatestTag(nextTag);
  await createGitHubRelease(nextTag, changelog);
  console.log(`GitHub Release created: ${nextTag}`);
})();
