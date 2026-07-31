export const id = 640;
export const ids = [640];
export const modules = {

/***/ 7640:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   o: () => (/* binding */ resolveAoccRelease)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3360);
/* harmony import */ var _lib_errors_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7507);
/* harmony import */ var _lib_http_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5312);
/* harmony import */ var _lib_version_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1018);





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
  return (0,_lib_http_js__WEBPACK_IMPORTED_MODULE_1__/* .requestTextWithRetries */ .d)(AOCC_DOWNLOAD_PAGE, {
    attempts: 3,
    headers: {
      'User-Agent': 'setup-fortran-conda',
      Accept: 'text/html,application/xhtml+xml',
    },
    onRetry(error) {
      (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
        `AOCC download page fetch failed ` +
          `(${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_2__/* .getErrorMessage */ .u)(error)}); retrying.`,
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
    (0,_lib_version_js__WEBPACK_IMPORTED_MODULE_3__/* .compareNumericVersions */ .UA)(right.version, left.version),
  );
}

async function resolveAoccRelease(requestedVersion = '') {
  const normalizedVersion = normalizeAoccVersion(requestedVersion);

  if (normalizedVersion === 'latest') {
    const releases = parseAoccDebReleases(await fetchAoccDownloadPage());
    const latestRelease = releases[0];
    if (!latestRelease) {
      throw new Error(
        `Unable to resolve latest AOCC Debian package from ${AOCC_DOWNLOAD_PAGE}.`,
      );
    }
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .info */ .pq)(`Resolved latest AOCC version: ${latestRelease.version}`);
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
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__/* .warning */ .$e)(
      `Unable to read AOCC download page for checksum discovery: ${(0,_lib_errors_js__WEBPACK_IMPORTED_MODULE_2__/* .getErrorMessage */ .u)(
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


/***/ })

};
