import fs from 'node:fs/promises';

export async function replaceMarkedSection({
  filePath,
  startMarker,
  endMarker,
  content,
}) {
  const source = await fs.readFile(filePath, 'utf8');
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `README markers not found. Add:\n${startMarker}\n${endMarker}`,
    );
  }

  const before = source.slice(0, startIndex + startMarker.length);
  const after = source.slice(endIndex);
  await fs.writeFile(filePath, `${before}\n\n${content}\n\n${after}`, 'utf8');
}
