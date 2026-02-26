import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const START = '<!-- STATUS:setup-fortran-conda:START -->';
const END = '<!-- STATUS:setup-fortran-conda:END -->';

function ghRequestJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        method: 'GET',
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'setup-fortran-conda',
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c.toString()));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed JSON parse: ${e}`));
            }
          } else {
            reject(new Error(`GitHub API failed: ${res.statusCode}\n${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function statusCell(job) {
  const c = job?.conclusion;
  if (c === 'success') return '✅';
  if (c === 'failure') return '❌';
  if (c === 'cancelled') return '⛔';
  if (c === 'skipped') return '⏭️';
  return '⏳';
}

function inferOsLabel(metaJob, apiJob) {
  const labels = apiJob?.labels || metaJob?.labels || [];
  const preferred = labels.find((x) => /-(latest|\d+)$/.test(x) && /^(ubuntu|macos|windows)/.test(x));
  if (preferred) return preferred;

  const n = String(metaJob?.name || apiJob?.name || '');
  const prefix = n.split('_')[0];
  if (prefix) return prefix;

  return '';
}

function inferTool(meta, apiJob) {
  if (meta.tool) return meta.tool;

  const n = String(meta.job?.name || apiJob?.name || '');
  const parts = n.split('_');
  return parts.length >= 2 ? parts[parts.length - 1] : '';
}

function escapeCell(s) {
  return String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function cleanVersion(s) {
  const t = escapeCell(s);
  if (!t) return 'Unknown';
  if (/Unable to locate executable file|not found|ENOENT|is not recognized as an internal or external command/i.test(t)) {
    return 'Not found';
  }
  return t.length > 40 ? t.slice(0, 37) + '…' : t;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';

  if (!token) throw new Error('Missing GITHUB_TOKEN/GH_TOKEN');
  if (!repo || !runId) throw new Error('Missing GITHUB_REPOSITORY or GITHUB_RUN_ID');

  const metaDir = process.env.SETUP_FORTRAN_CONDA_META_DIR || '.setup-fortran-conda-meta';
  const readmePath = process.env.README_FILE || 'README.md';

  let files = [];
  try {
    files = (await fs.readdir(metaDir)).filter((f) => f.endsWith('.json'));
  } catch {
    files = [];
  }

  const metas = [];
  for (const f of files) {
    const full = path.join(metaDir, f);
    try {
      metas.push(JSON.parse(await fs.readFile(full, 'utf8')));
    } catch {
      // ignore
    }
  }

  const jobsUrl = `${apiUrl}/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`;
  const jobsResp = await ghRequestJson(jobsUrl, token);
  const jobs = Array.isArray(jobsResp.jobs) ? jobsResp.jobs : [];
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  let rows = metas
    .map((m) => {
      const j = m?.job?.id ? jobById.get(m.job.id) : null;
      const os = escapeCell(inferOsLabel(m.job, j) || '-');
      const compiler = m?.compiler?.requested || '';
      const version = cleanVersion(m?.compiler?.actual_version || 'Unknown');
      const tool = escapeCell(inferTool(m, j));
      const toolVersion = cleanVersion(m?.tools?.[tool]?.version || 'Unknown');
      const status = statusCell(j);

      if (!compiler) return null;
      if (!tool) return null;

      return { os, compiler, version, tool, toolVersion, status };
    })
    .filter(Boolean);

  const seen = new Set();
  rows = rows.filter((r) => {
    const key = `${r.os}||${r.compiler}||${r.version}||${r.tool}||${r.toolVersion}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  rows.sort((a, b) =>
    `${a.os}\0${a.compiler}\0${a.version}\0${a.tool}`.localeCompare(
      `${b.os}\0${b.compiler}\0${b.version}\0${b.tool}`
    )
  );

  const tableLines = [];
  tableLines.push('| OS | Compiler | Version | Tool | Tool Version | Status |');
  tableLines.push('|---|---|---:|---|---:|:---:|');
  for (const r of rows) {
    tableLines.push(
      `| ${r.os} | \`${escapeCell(r.compiler)}\` | ${r.version} | ${r.tool} | ${r.toolVersion} | ${r.status} |`
    );
  }
  const table = tableLines.join('\n');

  const readme = await fs.readFile(readmePath, 'utf8');
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`README markers not found. Add:\n${START}\n${END}`);
  }

  const before = readme.slice(0, startIdx + START.length);
  const after = readme.slice(endIdx);

  const next = `${before}\n\n${table}\n\n${after}`;
  await fs.writeFile(readmePath, next, 'utf8');
  console.log('README.md updated with metadata-based CI table.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});