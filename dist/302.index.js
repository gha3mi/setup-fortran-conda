export const id = 302;
export const ids = [302];
export const modules = {

/***/ 3302:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  PE: () => (/* binding */ downloadFile),
  P6: () => (/* binding */ downloadVerifiedFile),
  U_: () => (/* binding */ fetchTextWithCurl),
  wS: () => (/* binding */ installAptPackages)
});

// EXTERNAL MODULE: ./node_modules/@actions/exec/lib/exec.js + 5 modules
var exec = __webpack_require__(2876);
// EXTERNAL MODULE: ./node_modules/@actions/core/lib/core.js + 11 modules
var core = __webpack_require__(3360);
// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__(7598);
// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(3024);
;// CONCATENATED MODULE: ./src/lib/checksum.js




function calculateSha256(file) {
  return new Promise((resolve, reject) => {
    const hash = (0,external_node_crypto_.createHash)('sha256');
    const stream = (0,external_node_fs_.createReadStream)(file);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifySha256({ file, product, version, expected }) {
  if (!expected) {
    (0,core/* warning */.$e)(
      `No ${product} checksum is known for ${version}; ` +
        'skipping checksum verification.',
    );
    return;
  }

  const actual = await calculateSha256(file);
  if (actual !== expected) {
    throw new Error(
      `${product} ${version} checksum mismatch: ` +
        `expected ${expected}, got ${actual}`,
    );
  }

  (0,core/* info */.pq)(`Verified ${product} ${version} SHA-256 checksum`);
}

// EXTERNAL MODULE: ./src/lib/command.js
var command = __webpack_require__(7819);
// EXTERNAL MODULE: ./src/lib/errors.js
var errors = __webpack_require__(7507);
// EXTERNAL MODULE: ./src/compilers/common.js
var common = __webpack_require__(9674);
;// CONCATENATED MODULE: ./src/compilers/linux/install.js






async function installAptPackages(
  packages,
  {
    groupName = 'setup-fortran-conda: Install System Packages',
    errorMessage = 'System package installation failed',
  } = {},
) {
  await (0,common/* runInGroup */.Se)(groupName, async () => {
    try {
      await (0,exec/* exec */.m)('sudo', ['apt-get', 'update', '-y']);
      await (0,exec/* exec */.m)('sudo', ['apt-get', 'install', '-y', ...packages]);
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,errors/* getErrorMessage */.u)(error)}`, {
        cause: error,
      });
    }
  });
}

async function downloadFile(
  url,
  destination,
  {
    connectTimeout,
    continueAt,
    http1 = false,
    retryCount = 3,
    retryDelay,
    silent = false,
  } = {},
) {
  const args = [
    ...(http1 ? ['--http1.1'] : []),
    '--fail',
    '--location',
    ...(silent ? ['--silent', '--show-error'] : []),
    ...(connectTimeout ? ['--connect-timeout', String(connectTimeout)] : []),
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    ...(retryDelay ? ['--retry-delay', String(retryDelay)] : []),
    ...(continueAt ? ['--continue-at', continueAt] : []),
    '--output',
    destination,
    url,
  ];

  await (0,exec/* exec */.m)('curl', args);
}

async function downloadVerifiedFile({
  url,
  destination,
  product,
  version,
  checksum,
  groupName,
  errorMessage,
  downloadOptions = {},
}) {
  await (0,common/* runInGroup */.Se)(groupName, async () => {
    try {
      await downloadFile(url, destination, downloadOptions);
      await verifySha256({
        file: destination,
        product,
        version,
        expected: checksum,
      });
    } catch (error) {
      throw new Error(`${errorMessage}: ${(0,errors/* getErrorMessage */.u)(error)}`, {
        cause: error,
      });
    }
  });
}

async function fetchTextWithCurl(
  url,
  { retryCount = 3, userAgent = 'setup-fortran-conda' } = {},
) {
  const result = await (0,command/* captureCommand */.g)('curl', [
    '--fail',
    '--location',
    '--silent',
    '--show-error',
    '--retry',
    String(retryCount),
    '--retry-all-errors',
    '--user-agent',
    userAgent,
    url,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to fetch ${url}: ${result.stderr || result.stdout}`,
    );
  }

  return result.stdout;
}


/***/ })

};
