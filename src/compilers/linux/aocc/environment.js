import { exec } from '@actions/exec';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const AOCC_SHELL_ENVIRONMENT = Object.freeze([
  'PATH',
  'LD_LIBRARY_PATH',
  'LIBRARY_PATH',
  'COMPILER_PATH',
  'CPATH',
  'C_INCLUDE_PATH',
  'CPLUS_INCLUDE_PATH',
]);

async function loadAoccEnvironment(environmentScriptPath) {
  let output = '';
  const command = [
    'set -e',
    'source "$1" >/dev/null',
    `for name in ${AOCC_SHELL_ENVIRONMENT.join(' ')}; do`,
    '  if [[ -v $name ]]; then',
    '    printf \'%s=%s\\0\' "$name" "${!name}"',
    '  fi',
    'done',
  ].join('\n');
  await exec(
    'bash',
    ['-c', command, 'setup-fortran-conda', environmentScriptPath],
    {
      silent: true,
      listeners: {
        stdout: (data) => {
          output += data.toString();
        },
      },
    },
  );

  const environment = {};
  for (const pair of output.split('\0')) {
    if (!pair) {
      continue;
    }
    const separator = pair.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = pair.slice(0, separator);
    if (!AOCC_SHELL_ENVIRONMENT.includes(key)) {
      continue;
    }
    const value = pair.slice(separator + 1);
    process.env[key] = value;
    environment[key] = value;
  }
  return environment;
}

function quoteBashArgument(value) {
  const escaped = String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('$', '\\$')
    .replaceAll('`', '\\`');
  return `"${escaped}"`;
}

function writeWrapper(wrapperDirectory, name, executablePath) {
  const wrapperPath = join(wrapperDirectory, name);
  writeFileSync(
    wrapperPath,
    `#!/usr/bin/env bash\nexec ${quoteBashArgument(executablePath)} "$@"\n`,
  );
  chmodSync(wrapperPath, 0o755);
}

function writeAmdflangWrapper(wrapperDirectory, compilerPath) {
  const wrapperPath = join(wrapperDirectory, 'amdflang');
  writeFileSync(
    wrapperPath,
    `#!/usr/bin/env bash
args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -fimplicit-none)
      shift
      ;;
    -module-dir)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: -module-dir requires an argument" >&2
        exit 1
      fi
      args+=("-module" "$2")
      shift 2
      ;;
    -module-dir=*)
      args+=("-module" "\${1#-module-dir=}")
      shift
      ;;
    -J)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: -J requires an argument" >&2
        exit 1
      fi
      args+=("-module" "$2")
      shift 2
      ;;
    -J*)
      args+=("-module" "\${1#-J}")
      shift
      ;;
    -MD)
      shift
      ;;
    -MQ|-MF)
      if [[ $# -lt 2 ]]; then
        echo "amdflang wrapper: $1 requires an argument" >&2
        exit 1
      fi
      shift 2
      ;;
    -MQ*|-MF*)
      shift
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

exec ${quoteBashArgument(compilerPath)} "\${args[@]}"
`,
  );
  chmodSync(wrapperPath, 0o755);
}

function createAoccWrappers(binDirectory) {
  const wrapperDirectory = join(
    process.env.RUNNER_TEMP || tmpdir(),
    'setup-fortran-conda-aocc-bin',
  );
  mkdirSync(wrapperDirectory, { recursive: true });

  const amdflangPath = existsSync(join(binDirectory, 'amdflang'))
    ? join(binDirectory, 'amdflang')
    : join(binDirectory, 'flang');
  writeAmdflangWrapper(wrapperDirectory, amdflangPath);

  if (!existsSync(join(binDirectory, 'amdclang'))) {
    writeWrapper(wrapperDirectory, 'amdclang', join(binDirectory, 'clang'));
  }
  if (!existsSync(join(binDirectory, 'amdclang++'))) {
    writeWrapper(wrapperDirectory, 'amdclang++', join(binDirectory, 'clang++'));
  }

  return wrapperDirectory;
}

export async function prepareAoccEnvironment(aoccRoot) {
  const environmentScriptPath = join(aoccRoot, 'setenv_AOCC.sh');
  if (!existsSync(environmentScriptPath)) {
    throw new Error(
      `Unable to locate AOCC environment script: ${environmentScriptPath}`,
    );
  }

  const binDirectory = join(aoccRoot, 'bin');
  return {
    binDirectory,
    wrapperDirectory: createAoccWrappers(binDirectory),
    variables: await loadAoccEnvironment(environmentScriptPath),
  };
}
