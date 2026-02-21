import fs from "fs";
import path from "path";

function readAllJson(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith(".json")) {
        try {
          out.push(JSON.parse(fs.readFileSync(p, "utf8")));
        } catch {}
      }
    }
  }
  return out;
}

function toolFromJob(job) {
  switch (String(job || "")) {
    case "test_fpm":
      return "fpm";
    case "test_cmake":
      return "cmake";
    case "test_meson":
      return "meson";
    case "test_mpi_fpm":
      return "mpi_fpm";
    default:
      return "";
  }
}

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

const inDir = process.argv[2];
const outFile = process.argv[3];

if (!inDir || !outFile) {
  console.error("Usage: node aggregate-versions.js <inputDir> <outputFile>");
  process.exit(2);
}

const input = readAllJson(inDir);

const byKey = new Map();

for (const r of input) {
  const os = pick(r, ["os"]);
  const compiler = pick(r, ["compiler"]).replaceAll("--", "-");
  const job = pick(r, ["job"]);
  const tool = toolFromJob(job);
  const req = pick(r, ["requested_compiler_version"]);
  const cver = pick(r, ["compiler_version", "version"]);

  if (!os || !compiler || !tool) continue;
  if (!cver || cver === "Unknown") continue;

  const key = `${os}::${compiler}::${tool}::${req}`;
  byKey.set(key, {
    os,
    compiler,
    tool,
    requested_compiler_version: req,
    compiler_version: cver,
  });
}

const entries = Array.from(byKey.values()).sort((a, b) => {
  const c1 = a.compiler.localeCompare(b.compiler);
  if (c1) return c1;
  const c2 = a.compiler_version.localeCompare(b.compiler_version);
  if (c2) return c2;
  const c3 = a.os.localeCompare(b.os);
  if (c3) return c3;
  const c4 = a.tool.localeCompare(b.tool);
  if (c4) return c4;
  return a.requested_compiler_version.localeCompare(b.requested_compiler_version);
});

const rowMap = new Map();
for (const e of entries) {
  const k = `${e.compiler}::${e.compiler_version}`;
  if (!rowMap.has(k)) rowMap.set(k, { compiler: e.compiler, compiler_version: e.compiler_version });
}

const out = {
  generated_at: new Date().toISOString().slice(0, 10),
  rows: Array.from(rowMap.values()).sort((a, b) => {
    const c = a.compiler.localeCompare(b.compiler);
    if (c) return c;
    return a.compiler_version.localeCompare(b.compiler_version);
  }),
  entries,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2), "utf8");
console.log(`Wrote ${outFile}`);