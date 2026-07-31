import https from 'node:https';
import { getErrorMessage } from './errors.js';

const DEFAULT_REDIRECT_LIMIT = 5;
const DEFAULT_TIMEOUT_MS = 60_000;

export class HttpResponseError extends Error {
  constructor(url, statusCode) {
    super(`Request to ${url} failed with HTTP ${statusCode}.`);
    this.name = 'HttpResponseError';
    this.statusCode = statusCode;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function redirectHeaders(headers, sourceUrl, destinationUrl) {
  if (sourceUrl.origin === destinationUrl.origin) {
    return headers;
  }

  return Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !['authorization', 'cookie'].includes(name.toLowerCase()),
    ),
  );
}

function requestText(
  url,
  {
    headers = {},
    redirectLimit = DEFAULT_REDIRECT_LIMIT,
    timeout = DEFAULT_TIMEOUT_MS,
  } = {},
) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers,
        timeout,
      },
      (response) => {
        const statusCode = response.statusCode || 0;
        const location = response.headers.location;

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          location &&
          redirectLimit > 0
        ) {
          response.resume();
          const sourceUrl = new URL(url);
          const destinationUrl = new URL(location, sourceUrl);
          resolve(
            requestText(destinationUrl.toString(), {
              headers: redirectHeaders(headers, sourceUrl, destinationUrl),
              redirectLimit: redirectLimit - 1,
              timeout,
            }),
          );
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new HttpResponseError(url, statusCode));
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error(`Request to ${url} timed out.`));
    });
    request.on('error', reject);
  });
}

export async function retryOperation(
  operation,
  { attempts = 3, onRetry, retryDelay = 1_000, shouldRetry = () => true } = {},
) {
  if (typeof operation !== 'function') {
    throw new Error('Retry operation must be a function.');
  }
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('HTTP request attempts must be a positive integer.');
  }
  if (!Number.isFinite(retryDelay) || retryDelay < 0) {
    throw new Error('Retry delay must be a non-negative number.');
  }

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !(await shouldRetry(error, attempt))) {
        throw error;
      }

      await onRetry?.(error, attempt);
      await delay(retryDelay);
    }
  }

  throw lastError;
}

export function requestTextWithRetries(
  url,
  {
    attempts = 3,
    onRetry,
    retryDelay = 1_000,
    shouldRetry,
    ...requestOptions
  } = {},
) {
  return retryOperation(() => requestText(url, requestOptions), {
    attempts,
    onRetry,
    retryDelay,
    shouldRetry,
  });
}

export async function requestJson(url, options = {}) {
  const body = await requestTextWithRetries(url, options);

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(
      `Unable to parse JSON from ${url}: ${getErrorMessage(error)}`,
      {
        cause: error,
      },
    );
  }
}
