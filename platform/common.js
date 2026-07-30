import {
  addPath,
  endGroup,
  exportVariable,
  info,
  startGroup,
} from '@actions/core';
import { exec as run } from '@actions/exec';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { delimiter, join, sep } from 'node:path';

export const TOOLS_ENVIRONMENT = 'fortran';

const RESERVED_ENVIRONMENT_NAME = /^(?:GITHUB_|RUNNER_)/i;

export function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

export async function grouped(name, operation) {
  startGroup(name);
  try {
    return await operation();
  } finally {
    endGroup();
  }
}

export function exportEnv(key, value) {
  if (value == null) return;

  const name = String(key);
  const upperName = name.toUpperCase();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid environment variable name: ${name}`);
  }
  if (
    RESERVED_ENVIRONMENT_NAME.test(name) ||
    upperName === 'NODE_OPTIONS'
  ) {
    throw new Error(`Refusing to export reserved environment variable: ${name}`);
  }
  if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV not defined');

  const normalized = String(value);
  exportVariable(name, normalized);
}

export function compilerEnvironment(fortran, c, cxx, extra = {}) {
  return {
    FC: fortran,
    CC: c,
    CXX: cxx,
    FPM_FC: fortran,
    FPM_CC: c,
    FPM_CXX: cxx,
    CMAKE_Fortran_COMPILER: fortran,
    CMAKE_C_COMPILER: c,
    CMAKE_CXX_COMPILER: cxx,
    ...extra,
  };
}

export async function exportCompilerEnvironment(values) {
  await grouped('setup-fortran-conda: Export Compiler Environment', async () => {
    for (const [key, value] of Object.entries(values)) {
      exportEnv(key, value);
      info(`Exported: ${key}`);
    }
  });
}

export async function getCondaPrefix(
  envName = TOOLS_ENVIRONMENT,
  required = true
) {
  let output = '';
  await run('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
    },
  });

  const { envs = [] } = JSON.parse(output);
  const prefix = envs.find(
    (candidate) =>
      candidate.endsWith(sep + envName) || candidate.endsWith('/' + envName)
  );

  if (!prefix && required) {
    throw new Error(`Unable to locate Conda environment "${envName}".`);
  }
  return prefix || '';
}

function prependEnvironmentPaths(paths, current = '') {
  const values = [
    ...paths,
    ...String(current)
      .split(delimiter)
      .filter(Boolean),
  ];
  const seen = new Set();

  return values
    .filter((value) => {
      const key = process.platform === 'win32' ? value.toLowerCase() : value;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(delimiter);
}

function createWindowsBlasAliases(prefix) {
  const libraryDir = join(prefix, 'Library', 'lib');
  const blas = join(libraryDir, 'blas.lib');
  const lapack = join(libraryDir, 'lapack.lib');
  if (existsSync(blas) && existsSync(lapack)) return '';

  const provider = [
    join(libraryDir, 'openblas.lib'),
    join(libraryDir, 'mkl_rt.lib'),
  ].find((path) => existsSync(path));
  if (!provider) return '';

  const aliasDir = join(libraryDir, 'setup-fortran-conda');
  mkdirSync(aliasDir, { recursive: true });
  copyFileSync(existsSync(blas) ? blas : provider, join(aliasDir, 'blas.lib'));
  copyFileSync(
    existsSync(lapack) ? lapack : provider,
    join(aliasDir, 'lapack.lib')
  );
  info(`Created Windows BLAS/LAPACK aliases from ${provider}`);
  return aliasDir;
}

export async function exportCondaEnvironment() {
  await grouped('setup-fortran-conda: Configure Conda Environment', async () => {
    const prefix = await getCondaPrefix();
    const windows = process.platform === 'win32';
    const blasAliasPath = windows ? createWindowsBlasAliases(prefix) : '';
    const libraryPaths = (
      windows
        ? [
            blasAliasPath,
            join(prefix, 'Library', 'lib'),
            join(prefix, 'lib'),
          ]
        : [join(prefix, 'lib')]
    ).filter((path) => existsSync(path));
    const includePaths = (
      windows
        ? [
            join(prefix, 'opt', 'compiler', 'include', 'intel64'),
            join(prefix, 'Library', 'include'),
          ]
        : [join(prefix, 'include')]
    ).filter((path) => existsSync(path));
    const pkgConfigPaths = (
      windows
        ? [
            join(prefix, 'Library', 'lib', 'pkgconfig'),
            join(prefix, 'Library', 'share', 'pkgconfig'),
            join(prefix, 'lib', 'pkgconfig'),
            join(prefix, 'share', 'pkgconfig'),
          ]
        : [
            join(prefix, 'lib', 'pkgconfig'),
            join(prefix, 'share', 'pkgconfig'),
          ]
    ).filter((path) => existsSync(path));
    const cmakePrefixes = windows
      ? [join(prefix, 'Library'), prefix]
      : [prefix];

    const environment = {
      LIBRARY_PATH: prependEnvironmentPaths(
        libraryPaths,
        process.env.LIBRARY_PATH
      ),
      CMAKE_LIBRARY_PATH: prependEnvironmentPaths(
        libraryPaths,
        process.env.CMAKE_LIBRARY_PATH
      ),
      CMAKE_PREFIX_PATH: prependEnvironmentPaths(
        cmakePrefixes,
        process.env.CMAKE_PREFIX_PATH
      ),
      PKG_CONFIG_PATH: prependEnvironmentPaths(
        pkgConfigPaths,
        process.env.PKG_CONFIG_PATH
      ),
    };

    if (process.platform === 'linux') {
      environment.LD_LIBRARY_PATH = prependEnvironmentPaths(
        libraryPaths,
        process.env.LD_LIBRARY_PATH
      );
    } else if (windows) {
      environment.LIB = prependEnvironmentPaths(
        libraryPaths,
        process.env.LIB
      );
      environment.INCLUDE = prependEnvironmentPaths(
        includePaths,
        process.env.INCLUDE
      );
    }

    for (const [key, value] of Object.entries(environment)) {
      if (!value) continue;
      exportEnv(key, value);
      info(`Exported: ${key}`);
    }
  });
}

function isTransientCondaError(output) {
  return /CondaHTTPError|HTTP\s+(?:403|408|429|5\d\d)\b|ConnectionError|Connection reset|Temporary failure|timed? out/i.test(
    output
  );
}

export async function installCondaPackages(
  packages,
  {
    envName = TOOLS_ENVIRONMENT,
    channels = ['conda-forge'],
    command = 'install',
    commandOptions = [],
    successMessage = 'Conda packages installed',
    errorMessage = 'Conda install failed',
  } = {}
) {
  await grouped('setup-fortran-conda: Install Conda Packages', async () => {
    const args = [
      command,
      ...commandOptions,
      '--yes',
      '--name',
      envName,
      ...packages,
    ];
    for (const channel of channels) args.push('-c', channel);

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let output = '';
      const capture = (data) => {
        output = (output + data.toString()).slice(-32768);
      };

      try {
        await run('conda', args, {
          listeners: {
            stdout: capture,
            stderr: capture,
          },
        });
        info(successMessage);
        return;
      } catch (error) {
        if (attempt === 2 || !isTransientCondaError(output)) {
          throw new Error(`${errorMessage}: ${error.message}`);
        }
        info('Transient Conda network error; retrying installation');
      }
    }
  });
}

export async function showCondaEnvironment(envNames = [TOOLS_ENVIRONMENT]) {
  await grouped('setup-fortran-conda: Show Conda Environment', async () => {
    await run('conda', ['info']);
    for (const envName of envNames) {
      await run('conda', ['list', '--name', envName]);
    }
  });
}

export async function addExistingPaths(paths, { log = true } = {}) {
  await grouped('setup-fortran-conda: Configure Compiler Paths', async () => {
    for (const path of paths) {
      if (!path || !existsSync(path)) continue;

      addPath(path);
      if (log) info(`Added to PATH: ${path}`);
    }
  });
}

export async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await grouped('setup-fortran-conda: Verify Compiler Commands', async () => {
    for (const { command, args } of commands) {
      await run(lookupCommand, [command]);
      if (args) await run(command, args);
    }
  });
}
