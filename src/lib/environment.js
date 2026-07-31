import { delimiter } from 'node:path';

export function prependPathEntries(
  entries,
  currentValue = '',
  separator = delimiter,
) {
  const caseInsensitive = process.platform === 'win32' || separator === ';';
  const seen = new Set();
  const values = [...entries, ...String(currentValue).split(separator)].filter(
    Boolean,
  );

  return values
    .filter((value) => {
      const key = caseInsensitive ? value.toLowerCase() : value;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .join(separator);
}

export function prependFlag(flag, currentValue = '') {
  const currentFlags = String(currentValue).trim();
  if (currentFlags.split(/\s+/).includes(flag)) {
    return currentFlags;
  }

  return [flag, currentFlags].filter(Boolean).join(' ');
}
