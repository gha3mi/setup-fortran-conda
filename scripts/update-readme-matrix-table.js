import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const START = '<!-- STATUS:setup-fortran-conda:START -->';
const END = '<!-- STATUS:setup-fortran-conda:END -->';

const TOOL_ORDER = ['fpm', 'cmake', 'meson'];
const OS_ORDER = ['ubuntu', 'macos', 'windows'];

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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
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

function statusEmoji(job) {
    const c = job?.conclusion;
    if (c === 'success') return '✅';
    if (c === 'failure') return '❌';
    if (c === 'cancelled') return '⛔';
    if (c === 'skipped') return '⏭️';
    return '⏳';
}

function escapeCell(s) {
    return String(s ?? '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .trim();
}

function cleanValue(s) {
    const t = escapeCell(s);
    if (!t) return 'Unknown';
    if (/Unable to locate executable file|not found|ENOENT|is not recognized as an internal or external command/i.test(t)) {
        return 'Not found';
    }
    return t.length > 48 ? t.slice(0, 45) + '…' : t;
}

function inferTool(meta, apiJob) {
    if (meta?.tool) return meta.tool;
    const n = String(meta?.job?.name || apiJob?.name || '');
    const parts = n.split('_');
    return parts.length >= 2 ? parts[parts.length - 1] : '';
}

function inferOsCombined(meta) {
    const fam = (meta?.runner?.os_family || '').toLowerCase();
    const ver = meta?.runner?.os_version || '';
    const label = meta?.runner?.os_label || '';

    if (fam === 'ubuntu' && ver) {
        const short = ver.split('.').slice(0, 2).join('.');
        return `ubuntu ${short}`;
    }

    if (fam === 'macos' && ver) {
        const major = ver.split('.')[0];
        return `macos ${major}`;
    }

    if (fam === 'windows') {
        const match = label.match(/(20\d{2})/);
        if (match) return `windows ${match[1]}`;
        return 'windows';
    }

    if (fam && ver) return `${fam} ${ver}`;
    if (fam) return fam;
    const fallback = (meta?.runner?.os || 'unknown').toLowerCase();
    return fallback;
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
        try {
            metas.push(JSON.parse(await fs.readFile(path.join(metaDir, f), 'utf8')));
        } catch {
        }
    }

    const jobsResp = await ghRequestJson(
        `${apiUrl}/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`,
        token
    );
    const jobs = Array.isArray(jobsResp.jobs) ? jobsResp.jobs : [];
    const jobById = new Map(jobs.map((j) => [j.id, j]));

    const usedTools = new Set();
    for (const m of metas) {
        const j = m?.job?.id ? jobById.get(m.job.id) : null;
        const tool = inferTool(m, j);
        if (TOOL_ORDER.includes(tool)) usedTools.add(tool);
    }
    const tools = TOOL_ORDER.filter((t) => usedTools.has(t));

    const matrix = new Map();

    function keyOf(os, compiler, version) {
        return `${os}||${compiler}||${version}`;
    }

    for (const m of metas) {
        const j = m?.job?.id ? jobById.get(m.job.id) : null;
        const tool = inferTool(m, j);

        if (!TOOL_ORDER.includes(tool)) continue;
        if (!tools.includes(tool)) continue;

        const osCombined = escapeCell(inferOsCombined(m));
        const compiler = escapeCell(m?.compiler?.requested || '');
        if (!compiler) continue;

        const compilerVersion = cleanValue(m?.compiler?.actual_version || 'Unknown');
        const toolVersion = cleanValue(m?.tools?.[tool]?.version || 'Unknown');
        const status = statusEmoji(j);

        const key = keyOf(osCombined, compiler, compilerVersion);

        if (!matrix.has(key)) {
            const base = { os: osCombined, compiler, compilerVersion };
            for (const t of tools) base[t] = '—';
            matrix.set(key, base);
        }

        matrix.get(key)[tool] = `${toolVersion} ${status}`;
    }

    let rows = Array.from(matrix.values());

    rows.sort((a, b) => {
        const aFam = String(a.os || '').split(' ')[0];
        const bFam = String(b.os || '').split(' ')[0];

        const aIdx = OS_ORDER.indexOf(aFam);
        const bIdx = OS_ORDER.indexOf(bFam);

        const aRank = aIdx === -1 ? 999 : aIdx;
        const bRank = bIdx === -1 ? 999 : bIdx;

        if (aRank !== bRank) return aRank - bRank;

        const osCmp = String(a.os).localeCompare(String(b.os), undefined, { numeric: true });
        if (osCmp !== 0) return osCmp;

        const compCmp = String(a.compiler).localeCompare(String(b.compiler), undefined, { numeric: true });
        if (compCmp !== 0) return compCmp;

        return String(a.compilerVersion).localeCompare(String(b.compilerVersion), undefined, { numeric: true });
    });

    const header = ['OS', 'Compiler', 'Version', ...tools];
    const align = ['---', '---', '---:', ...tools.map(() => ':---:')];

    const lines = [];
    lines.push(`| ${header.join(' | ')} |`);
    lines.push(`|${align.map((x) => ` ${x} `).join('|')}|`);

    for (const r of rows) {
        const cells = [
            r.os || '-',
            `\`${escapeCell(r.compiler)}\``,
            r.compilerVersion || 'Unknown',
            ...tools.map((t) => r[t] || '—'),
        ];
        lines.push(`| ${cells.join(' | ')} |`);
    }

    const table = lines.join('\n');

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

    console.log('README updated with matrix table.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});