export function firstLine(value) {
  return String(value || '')
    .split(/\r?\n/, 1)[0]
    .trim();
}

export function firstVersion(value) {
  const match = String(value || '').match(/\b\d+(?:\.\d+){1,3}\b/);
  return match?.[0] || '';
}

export function compareNumericVersions(left, right) {
  const leftParts = String(left).split(/[.-]/).map(Number);
  const rightParts = String(right).split(/[.-]/).map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function normalizeRequestedVersion(value) {
  const version = String(value || '').trim();
  return version.toLowerCase() === 'latest' ? '' : version;
}
