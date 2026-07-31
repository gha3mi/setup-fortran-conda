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
