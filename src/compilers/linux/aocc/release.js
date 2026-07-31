import { info, warning } from '@actions/core';
import { getErrorMessage } from '../../../lib/errors.js';
import { requestTextWithRetries } from '../../../lib/http.js';
import { compareNumericVersions } from '../../../lib/version.js';

const AOCC_DOWNLOAD_PAGE = 'https://www.amd.com/en/developer/aocc.html';

function normalizeAoccVersion(version = '') {
  const normalizedInput = version.trim().toLowerCase();
  if (!normalizedInput || normalizedInput === 'latest') {
    return 'latest';
  }

  const versionWithoutPrefix = normalizedInput
    .replace(/^v/, '')
    .replace(/^aocc-compiler-/, '')
    .replace(/_1_amd64\.deb$/, '');
  const normalizedVersion = /^\d+\.\d+$/.test(versionWithoutPrefix)
    ? `${versionWithoutPrefix}.0`
    : versionWithoutPrefix;

  if (!/^\d+\.\d+\.\d+$/.test(normalizedVersion)) {
    throw new Error(
      'AOCC compiler-version must be "latest", major.minor, or ' +
        `major.minor.patch; got "${version}".`,
    );
  }

  return normalizedVersion;
}

function createAoccDebUrl(version) {
  const [majorVersion, minorVersion] = version.split('.');
  return (
    'https://download.amd.com/developer/eula/aocc/' +
    `aocc-${majorVersion}-${minorVersion}/` +
    `aocc-compiler-${version}_1_amd64.deb`
  );
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function resolveDownloadUrl(href, filename) {
  if (!href) {
    return '';
  }

  let url;
  try {
    url = new URL(decodeHtml(href), AOCC_DOWNLOAD_PAGE);
  } catch {
    return '';
  }

  if (url.hostname !== 'download.amd.com') {
    return '';
  }
  if (!url.pathname.endsWith(filename)) {
    return '';
  }
  return url.toString();
}

function fetchAoccDownloadPage() {
  return requestTextWithRetries(AOCC_DOWNLOAD_PAGE, {
    attempts: 3,
    headers: {
      'User-Agent': 'setup-fortran-conda',
      Accept: 'text/html,application/xhtml+xml',
    },
    onRetry(error) {
      warning(
        `AOCC download page fetch failed ` +
          `(${getErrorMessage(error)}); retrying.`,
      );
    },
    retryDelay: 2_000,
  });
}

function parseAoccDebReleases(html) {
  const releases = new Map();
  const filenameRegex = /aocc-compiler-(\d+\.\d+\.\d+)_1_amd64\.deb/g;
  let match;

  while ((match = filenameRegex.exec(html)) !== null) {
    const version = match[1];
    const filename = match[0];
    const contextStart = Math.max(0, match.index - 1000);
    const contextEnd = Math.min(
      html.length,
      match.index + filename.length + 2500,
    );
    const context = html.slice(contextStart, contextEnd);
    const contentAfterFilename = html.slice(
      match.index + filename.length,
      contextEnd,
    );

    const directUrl = context.match(
      new RegExp(
        `https://download\\.amd\\.com[^"'\\s<>]*${escapeRegularExpression(
          filename,
        )}`,
        'i',
      ),
    );
    const href = context.match(
      new RegExp(
        `href=["']([^"']*${escapeRegularExpression(filename)}[^"']*)["']`,
        'i',
      ),
    );
    const hrefUrl = resolveDownloadUrl(href?.[1], filename);
    let url = createAoccDebUrl(version);
    if (directUrl) {
      url = decodeHtml(directUrl[0]);
    } else if (hrefUrl) {
      url = hrefUrl;
    }

    const checksum = (
      contentAfterFilename.match(/\b[a-fA-F0-9]{64}\b/)?.[0] || ''
    ).toLowerCase();
    releases.set(version, { version, url, checksum });
  }

  return Array.from(releases.values()).sort((left, right) =>
    compareNumericVersions(right.version, left.version),
  );
}

export async function resolveAoccRelease(requestedVersion = '') {
  const normalizedVersion = normalizeAoccVersion(requestedVersion);

  if (normalizedVersion === 'latest') {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const latestRelease = releases[0];
    if (!latestRelease) {
      throw new Error(
        `Unable to resolve latest AOCC Debian package from ${AOCC_DOWNLOAD_PAGE}.`,
      );
    }
    info(`Resolved latest AOCC version: ${latestRelease.version}`);
    return latestRelease;
  }

  try {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const matchingRelease = releases.find(
      (candidate) => candidate.version === normalizedVersion,
    );
    if (matchingRelease) {
      return matchingRelease;
    }
  } catch (error) {
    warning(
      `Unable to read AOCC download page for checksum discovery: ${getErrorMessage(
        error,
      )}`,
    );
  }

  return {
    version: normalizedVersion,
    url: createAoccDebUrl(normalizedVersion),
    checksum: '',
  };
}
