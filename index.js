import { setFailed, summary, setOutput } from '@actions/core';
import { exec as _exec } from '@actions/exec';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';

function nowIso() {
  return new Date().toISOString();
}

async function execCapture(cmd, args = []) {
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    exitCode = await _exec(cmd, args, {
      ignoreReturnCode: true,
      listeners: {
        stdout: (d) => (stdout += d.toString()),
        stderr: (d) => (stderr += d.toString()),
      },
    });
  } catch (e) {
    return { stdout, stderr: (stderr || '') + String(e), exitCode: 1 };
  }
  return { stdout, stderr, exitCode };
}

function firstLine(s) {
  return (s || '').split(/\r?\n/)[0]?.trim() ?? '';
}

function pickFirstVersionLike(text) {
  const m = (text || '').match(/\b\d+(?:\.\d+){1,3}\b/);
  return m ? m[0] : '';
}

function isNotFoundMessage(s) {
  return /Unable to locate executable file|not found|ENOENT|is not recognized as an internal or external command/i.test(
    s || ''
  );
}

async function detectCompilerVersion(compilerBinary, compilerKey) {
  const probes = [];

  if (compilerKey === 'gfortran') {
    probes.push([compilerBinary, ['-dumpfullversion', '-dumpversion']]);
    probes.push([compilerBinary, ['-dumpversion']]);
  }

  probes.push([compilerBinary, ['--version']]);
  probes.push([compilerBinary, ['-V']]);
  probes.push([compilerBinary, ['-v']]);

  for (const [cmd, args] of probes) {
    const { stdout, stderr, exitCode } = await execCapture(cmd, args);
    const raw = firstLine(stdout) || firstLine(stderr);
    const combined = `${stdout}\n${stderr}`.trim();

    if (exitCode !== 0 && isNotFoundMessage(combined || raw)) {
      return {
        actual_version: 'Not found',
        raw_first_line: raw || firstLine(combined) || 'Not found',
        probe: `${cmd} ${args.join(' ')}`.trim(),
      };
    }

    const ver = pickFirstVersionLike(combined) || pickFirstVersionLike(raw);

    if (exitCode === 0 || raw) {
      return {
        actual_version: ver || (raw ? raw : 'Unknown'),
        raw_first_line: raw || 'Unknown',
        probe: `${cmd} ${args.join(' ')}`.trim(),
      };
    }
  }

  return { actual_version: 'Unknown', raw_first_line: 'Unknown', probe: 'none' };
}

async function detectToolVersion(tool) {
  if (!tool) return null;

  const run = async (cmd, args) => {
    const { stdout, stderr, exitCode } = await execCapture(cmd, args);
    const combined = `${stdout}\n${stderr}`.trim();
    const line = firstLine(stdout) || firstLine(stderr);
    if (exitCode !== 0 && isNotFoundMessage(combined || line)) return 'Not found';
    if (exitCode !== 0 && !line) return 'Unknown';
    const ver = pickFirstVersionLike(combined) || pickFirstVersionLike(line);
    return ver || line || 'Unknown';
  };

  if (tool === 'fpm') return await run('fpm', ['--version']);
  if (tool === 'cmake') return await run('cmake', ['--version']);
  if (tool === 'meson') return await run('meson', ['--version']);

  return null;
}

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
              reject(new Error(`Failed to parse JSON from ${url}: ${e}`));
            }
          } else {
            reject(new Error(`GitHub API ${url} failed: ${res.statusCode}\n${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function runnerNameMatches(envRunnerName, apiRunnerName, apiRunnerId) {
  if (!envRunnerName || !apiRunnerName) return false;
  const env = envRunnerName.trim();
  const api = apiRunnerName.trim();
  const apiUnderscore = api.replace(/\s+/g, '_');
  const apiWithId = apiRunnerId != null ? `${apiUnderscore}_${apiRunnerId}` : null;

  return env === api || env === apiUnderscore || (apiWithId && env === apiWithId);
}

async function findCurrentJob(token) {
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const envRunnerName = process.env.RUNNER_NAME || '';
  if (!token || !repo || !runId) return null;

  const url = `${apiUrl}/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`;
  const data = await ghRequestJson(url, token);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  const matches = jobs.filter((j) => runnerNameMatches(envRunnerName, j.runner_name, j.runner_id));
  const inProgress = matches.filter((j) => j.status === 'in_progress');
  const candidates = inProgress.length ? inProgress : matches;

  if (!candidates.length) return null;

  const compiler = (process.env.INPUT_COMPILER || '').toLowerCase();
  const byCompiler = candidates.find((j) => typeof j.name === 'string' && j.name.includes(compiler));
  return byCompiler || candidates.sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0];
}

function inferToolFromJobName(jobName) {
  const parts = String(jobName || '').split('_');
  return parts.length >= 3 ? parts[parts.length - 1] : '';
}

async function run() {
  let fatalError = null;

  const compiler = (process.env.INPUT_COMPILER || '').toLowerCase();
  const versionRequested = process.env.INPUT_COMPILER_VERSION || '';
  const platformInput = (process.env.INPUT_PLATFORM || '').toLowerCase();
  const extrasInput = process.env.INPUT_EXTRA_PACKAGES || '';
  const fpmVersion = process.env.INPUT_FPM_VERSION || '';

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  let jobInfo = null;

  const metaBase = {
    schema_version: 1,
    repo: process.env.GITHUB_REPOSITORY || '',
    run_id: Number(process.env.GITHUB_RUN_ID || 0),
    created_at: nowIso(),
    job: { id: null, name: '', labels: [] },
    runner: {
      os: process.env.RUNNER_OS || '',
      arch: process.env.RUNNER_ARCH || '',
      name: process.env.RUNNER_NAME || '',
    },
    compiler: {
      requested: compiler,
      requested_version: versionRequested === '' ? 'latest' : versionRequested,
      binary: process.env.FC || compiler,
      actual_version: 'Unknown',
      raw_first_line: 'Unknown',
    },
    tool: '',
    tools: {},
    error: '',
  };

  const fallbackSuffix = `${process.env.GITHUB_RUN_ID || 'run'}-${Date.now()}`;

  const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
  let metaPath = path.join(tempDir, `setup-fortran-conda-meta-${fallbackSuffix}.json`);

  try {
    const osKey =
      platformInput.includes('ubuntu') || platformInput.includes('linux')
        ? 'lin'
        : platformInput.includes('windows')
          ? 'win'
          : platformInput.includes('macos')
            ? 'mac'
            : undefined;
    if (!osKey) throw new Error(`Unsupported platform: ${platformInput}`);

    const { installExtras } = await import('./extra.js');
    const extras = extrasInput
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    await installExtras('fortran', extras, fpmVersion);

    const { setup } = await import(`./platform/${osKey}/${compiler}.js`);
    await setup(versionRequested);

    jobInfo = await findCurrentJob(token);
    if (jobInfo?.id) {
      metaBase.job.id = jobInfo.id;
      metaBase.job.name = jobInfo.name || '';
      metaBase.job.labels = jobInfo.labels || [];
      metaBase.tool = inferToolFromJobName(jobInfo.name);
      metaPath = path.join(tempDir, `setup-fortran-conda-meta-${jobInfo.id}.json`);
    }

    const compilerBinary = process.env.FC || compiler;
    const v = await detectCompilerVersion(compilerBinary, compiler);
    metaBase.compiler.binary = compilerBinary;
    metaBase.compiler.actual_version = v.actual_version;
    metaBase.compiler.raw_first_line = v.raw_first_line;

    if (metaBase.tool) {
      const tv = await detectToolVersion(metaBase.tool);
      if (tv != null) metaBase.tools[metaBase.tool] = { version: tv };
    }

    await summary
      .addTable([
        ['OS', 'Compiler', 'Version'],
        [platformInput, compiler, metaBase.compiler.actual_version],
      ])
      .write();
  } catch (err) {
    fatalError = err;
    metaBase.error = err?.message ? String(err.message) : String(err);
  } finally {
    await fs.writeFile(metaPath, JSON.stringify(metaBase, null, 2), 'utf8');

    const runnerTag = [
      (process.env.RUNNER_OS || '').toLowerCase() || 'os',
      (process.env.RUNNER_ARCH || '').toLowerCase() || 'arch',
      (process.env.RUNNER_NAME || '').replace(/[^\w.-]+/g, '_').slice(0, 32) || 'runner',
    ].join('-');

    setOutput('metadata-path', metaPath);
    setOutput(
      'metadata-artifact-name',
      `setup-fortran-conda-meta-${metaBase.job.id || `${runnerTag}-${fallbackSuffix}`}`
    );
    setOutput('job-id', metaBase.job.id ? String(metaBase.job.id) : '');
  }

  if (fatalError) throw fatalError;
}

run().catch((err) => setFailed(err?.message ? err.message : String(err)));