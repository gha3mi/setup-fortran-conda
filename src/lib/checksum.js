import { info, warning } from '@actions/core';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

function calculateSha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(file);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function verifySha256({ file, product, version, expected }) {
  if (!expected) {
    warning(
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

  info(`Verified ${product} ${version} SHA-256 checksum`);
}
