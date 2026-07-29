import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'git',
  ['status', '--short', '--untracked-files=all', '--', 'dist'],
  { encoding: 'utf8' }
);

if (result.error) {
  console.error(`Failed to inspect dist/: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

if (result.stdout.trim()) {
  console.error('The generated dist/ has uncommitted changes:');
  process.stderr.write(result.stdout);
  console.error('Run "npm run build" and commit the resulting dist/ changes.');
  process.exit(1);
}

console.log('dist/ is synchronized.');
