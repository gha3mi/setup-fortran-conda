import { captureCommand } from './command.js';
import { requestGitHubJson } from './github.js';
import { firstLine } from './version.js';

export async function detectOperatingSystem() {
  const runnerOs = process.env.RUNNER_OS || '';

  if (runnerOs === 'Linux') {
    const result = await captureCommand('bash', [
      '-c',
      'source /etc/os-release 2>/dev/null && ' +
        'echo "${ID:-linux}|${VERSION_ID:-}" || echo "linux|"',
    ]);
    const [rawId, rawVersion] = String(
      firstLine(result.stdout) || 'linux|',
    ).split('|');
    const id = (rawId || 'linux').trim();
    const version = (rawVersion || '').trim();
    const family = id === 'ubuntu' ? 'ubuntu' : id;

    return {
      family,
      version,
      label: version ? `${family} ${version}` : family,
    };
  }

  if (runnerOs === 'macOS') {
    const result = await captureCommand('sw_vers', ['-productVersion']);
    const version = firstLine(result.stdout);

    return {
      family: 'macos',
      version,
      label: version ? `macos ${version}` : 'macos',
    };
  }

  if (runnerOs === 'Windows') {
    const result = await captureCommand('powershell', [
      '-NoProfile',
      '-Command',
      '$os=(Get-CimInstance Win32_OperatingSystem); ' +
        '"$($os.Caption)|$($os.Version)"',
    ]);
    const [rawCaption, rawVersion] = String(
      firstLine(result.stdout) || 'Windows|',
    ).split('|');
    const version = (rawVersion || '').trim();
    const caption = (rawCaption || 'Windows')
      .replace(/^Microsoft\s+/i, '')
      .trim();

    return {
      family: 'windows',
      version,
      label: version ? `${caption} ${version}` : caption,
    };
  }

  return {
    family: (runnerOs || 'unknown').toLowerCase(),
    version: '',
    label: runnerOs || 'unknown',
  };
}

function runnerNamesMatch(environmentName, apiName, apiId) {
  if (!environmentName || !apiName) {
    return false;
  }

  const normalizedEnvironmentName = environmentName.trim();
  const normalizedApiName = apiName.trim();
  const apiNameWithUnderscores = normalizedApiName.replace(/\s+/g, '_');
  const apiNameWithId =
    apiId === null || apiId === undefined
      ? ''
      : `${apiNameWithUnderscores}_${apiId}`;

  return [normalizedApiName, apiNameWithUnderscores, apiNameWithId].includes(
    normalizedEnvironmentName,
  );
}

export async function findCurrentJob(token) {
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const runnerName = process.env.RUNNER_NAME || '';

  if (!token || !repository || !runId) {
    return null;
  }

  const response = await requestGitHubJson(
    `${apiUrl}/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`,
    token,
  );
  const jobs = Array.isArray(response.jobs) ? response.jobs : [];
  const matchingJobs = jobs.filter((job) =>
    runnerNamesMatch(runnerName, job.runner_name, job.runner_id),
  );
  const inProgressJobs = matchingJobs.filter(
    (job) => job.status === 'in_progress',
  );
  const candidates = inProgressJobs.length > 0 ? inProgressJobs : matchingJobs;

  if (!candidates.length) {
    return null;
  }

  const compiler = String(process.env.INPUT_COMPILER || '').toLowerCase();
  const mpi = String(process.env.INPUT_MPI || 'none').toLowerCase();
  const matchingToolchain = candidates.find((job) => {
    if (typeof job.name !== 'string' || !job.name.includes(compiler)) {
      return false;
    }
    return mpi === 'none' || job.name.includes(mpi);
  });

  return (
    matchingToolchain ||
    candidates.sort((left, right) =>
      String(right.started_at).localeCompare(String(left.started_at)),
    )[0]
  );
}
