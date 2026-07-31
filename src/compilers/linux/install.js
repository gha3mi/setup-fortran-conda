import { exec } from '@actions/exec';
import { verifySha256 } from '../../lib/checksum.js';
import { captureCommand } from '../../lib/command.js';
import { getErrorMessage } from '../../lib/errors.js';
import { runInGroup } from '../common.js';

export async function installAptPackages(
  packages,
  {
    groupName = 'setup-fortran-conda: Install System Packages',
    errorMessage = 'System package installation failed',
  } = {},
) {
  await runInGroup(groupName, async () => {
    try {
      await exec('sudo', ['apt-get', 'update', '-y']);
      await exec('sudo', ['apt-get', 'install', '-y', ...packages]);
    } catch (error) {
      throw new Error(`${errorMessage}: ${getErrorMessage(error)}`, {
        cause: error,
      });
    }
  });
}

export async function downloadFile(
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

  await exec('curl', args);
}

export async function downloadVerifiedFile({
  url,
  destination,
  product,
  version,
  checksum,
  groupName,
  errorMessage,
  downloadOptions = {},
}) {
  await runInGroup(groupName, async () => {
    try {
      await downloadFile(url, destination, downloadOptions);
      await verifySha256({
        file: destination,
        product,
        version,
        expected: checksum,
      });
    } catch (error) {
      throw new Error(`${errorMessage}: ${getErrorMessage(error)}`, {
        cause: error,
      });
    }
  });
}

export async function fetchTextWithCurl(
  url,
  { retryCount = 3, userAgent = 'setup-fortran-conda' } = {},
) {
  const result = await captureCommand('curl', [
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
