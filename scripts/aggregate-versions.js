import fs from 'fs';
import path from 'path';

function readAllJson(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function parseV(v) {
  const m = String(v).match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
}

function cmp(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

const inDir = process.argv[2];
const outFile = process.argv[3];

if (!inDir || !outFile) {
  console.error('Usage: node aggregate-versions.js <inputDir> <outputFile>');
  process.exit(2);
}

const rows = readAllJson(inDir);

const best = {};
for (const r of rows) {
  const c = r?.compiler;
  const v = r?.version;
  if (!c || !v || v === 'Unknown') continue;

  const pv = parseV(v);
  if (!best[c]) {
    best[c] = { v, pv };
    continue;
  }
  if (pv && best[c].pv && cmp(pv, best[c].pv) > 0) {
    best[c] = { v, pv };
  }
}

const out = {
  generated_at: new Date().toISOString().slice(0, 10),
  'fortran-compilers': Object.fromEntries(
    Object.entries(best).map(([k, o]) => [k, o.v])
  ),
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${outFile}`);