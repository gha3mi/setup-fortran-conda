import { requestJson } from './http.js';

const GITHUB_API_VERSION = '2022-11-28';
const USER_AGENT = 'setup-fortran-conda';

export function requestGitHubJson(url, token = '') {
  return requestJson(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
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
