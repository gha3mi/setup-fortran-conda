import fs from 'fs';
import path from 'path';

function readAllJson(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];
  const stack = [dir];

  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });

    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else if (e.isFile() && e.name.endsWith('.json')) {
        out.push(JSON.parse(fs.readFileSync(p, 'utf8')));
      }
    }
  }

  return out;
}

function parseV(v) {
  const m = String(v).match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
}

function cmpSemver(a, b) {
  const pa = parseV(a);
  const pb = parseV(b);

  if (!pa && !pb) return String(a).localeCompare(String(b));
  if (!pa) return 1;
  if (!pb) return -1;

  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}

const inDir = process.argv[2];
const outFile = process.argv[3];

if (!inDir || !outFile) {
  console.error('Usage: node aggregate-versions.js <inputDir> <outputFile>');
  process.exit(2);
}

const rowsIn = readAllJson(inDir);

const seen = new Map();

for (const r of rowsIn) {
  const compiler = String(r?.compiler || '').trim();
  const version = String(r?.version || '').trim();

  if (!compiler || !version || version === 'Unknown') continue;

  const key = `${compiler}::${version}`;
  if (!seen.has(key)) seen.set(key, { compiler, version });
}

const rows = Array.from(seen.values()).sort((a, b) => {
  const c = a.compiler.localeCompare(b.compiler);
  if (c !== 0) return c;
  return cmpSemver(a.version, b.version);
});

const out = {
  generated_at: new Date().toISOString().slice(0, 10),
  rows,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${outFile}`);