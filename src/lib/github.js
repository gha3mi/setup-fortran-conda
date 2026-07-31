import { getErrorMessage } from './errors.js';
import { requestJson } from './http.js';

const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_REQUEST_ATTEMPTS = 4;
const GITHUB_RETRY_DELAY_MS = 2_000;
const USER_AGENT = 'setup-fortran-conda';
const TRANSIENT_HTTP_STATUSES = new Set([408, 425, 429]);

export function getGitHubToken(environment = process.env) {
  return environment.GITHUB_TOKEN || environment.GH_TOKEN || '';
}

export function isTransientGitHubRequestError(error) {
  const statusCode = Number(error?.statusCode);
  if (!Number.isInteger(statusCode)) {
    return true;
  }

  return statusCode >= 500 || TRANSIENT_HTTP_STATUSES.has(statusCode);
}

export function requestGitHubJson(url, token = '') {
  return requestJson(url, {
    attempts: GITHUB_REQUEST_ATTEMPTS,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    onRetry(error, attempt) {
      console.warn(
        `GitHub API request failed (${getErrorMessage(error)}); ` +
          `retrying (${attempt + 1}/${GITHUB_REQUEST_ATTEMPTS}).`,
      );
    },
    retryDelay: GITHUB_RETRY_DELAY_MS,
    shouldRetry: isTransientGitHubRequestError,
  });
}

export async function requestWorkflowJobs({
  apiUrl = 'https://api.github.com',
  repository,
  runId,
  token = '',
  request = requestGitHubJson,
}) {
  if (!repository || !runId) {
    throw new Error('Repository and workflow run ID are required.');
  }

  const jobs = [];
  const perPage = 100;

  for (let page = 1; ; page += 1) {
    const url = new URL(
      `${apiUrl.replace(/\/$/, '')}/repos/${repository}/actions/runs/${runId}/jobs`,
    );
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));

    const response = await request(url.toString(), token);
    const pageJobs = Array.isArray(response.jobs) ? response.jobs : [];
    jobs.push(...pageJobs);

    const totalCount = Number(response.total_count);
    if (
      pageJobs.length < perPage ||
      (Number.isFinite(totalCount) && jobs.length >= totalCount)
    ) {
      break;
    }
  }

  return jobs;
}
