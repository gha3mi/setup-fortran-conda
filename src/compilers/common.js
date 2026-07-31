import {
  addPath,
  endGroup,
  exportVariable,
  info,
  startGroup,
} from '@actions/core';
import { exec } from '@actions/exec';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { captureCommand } from '../lib/command.js';
import { prependPathEntries } from '../lib/environment.js';
import { getErrorMessage } from '../lib/errors.js';

export const TOOLS_ENVIRONMENT_NAME = 'fortran';
export { prependPathEntries };

const RESERVED_ENVIRONMENT_NAME = /^(?:GITHUB_|RUNNER_)/i;

export function assertPlatform(expected, message) {
  if (process.platform !== expected) {
    throw new Error(message);
  }
}

export async function runInGroup(name, operation) {
  startGroup(name);
  try {
    return await operation();
  } finally {
    endGroup();
  }
}

export function exportEnvironmentVariable(key, value) {
  if (value === null || value === undefined) {
    return;
  }

  const name = String(key);
  const upperName = name.toUpperCase();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid environment variable name: ${name}`);
  }
  if (RESERVED_ENVIRONMENT_NAME.test(name) || upperName === 'NODE_OPTIONS') {
    throw new Error(
      `Refusing to export reserved environment variable: ${name}`,
    );
  }
  if (!process.env.GITHUB_ENV) {
    throw new Error('GITHUB_ENV not defined');
  }

  const normalized = String(value);
  exportVariable(name, normalized);
}

export function createCompilerEnvironment(
  fortranCompiler,
  cCompiler,
  cxxCompiler,
  extraVariables = {},
) {
  return {
    FC: fortranCompiler,
    CC: cCompiler,
    CXX: cxxCompiler,
    FPM_FC: fortranCompiler,
    FPM_CC: cCompiler,
    FPM_CXX: cxxCompiler,
    CMAKE_Fortran_COMPILER: fortranCompiler,
    CMAKE_C_COMPILER: cCompiler,
    CMAKE_CXX_COMPILER: cxxCompiler,
    ...extraVariables,
  };
}

function exportVariables(values, { skipEmpty = false } = {}) {
  for (const [key, value] of Object.entries(values)) {
    if (skipEmpty && !value) {
      continue;
    }

    exportEnvironmentVariable(key, value);
    info(`Exported: ${key}`);
  }
}

export async function exportEnvironment(
  values,
  groupName = 'setup-fortran-conda: Export Environment',
) {
  await runInGroup(groupName, async () => {
    exportVariables(values);
  });
}

export async function exportCompilerEnvironment(values) {
  await exportEnvironment(
    values,
    'setup-fortran-conda: Export Compiler Environment',
  );
}

export async function getCondaPrefix(
  environmentName = TOOLS_ENVIRONMENT_NAME,
  required = true,
) {
  const result = await captureCommand('conda', ['env', 'list', '--json']);
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect Conda environments: ${result.stderr || result.stdout}`,
    );
  }

  let environments;
  try {
    const parsed = JSON.parse(result.stdout);
    environments = Array.isArray(parsed.envs) ? parsed.envs : [];
  } catch (error) {
    throw new Error(
      `Unable to parse Conda environment list: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }

  const condaPrefix = environments.find(
    (candidate) =>
      typeof candidate === 'string' &&
      (candidate.endsWith(sep + environmentName) ||
        candidate.endsWith(`/${environmentName}`)),
  );

  if (!condaPrefix && required) {
    throw new Error(`Unable to locate Conda environment "${environmentName}".`);
  }
  return condaPrefix || '';
}

export function createCondaPackageSpec(name, version = '') {
  return version ? `${name}=${version}` : name;
}

export function getCondaExecutablePaths(
  condaPrefix,
  runtimePlatform = process.platform,
) {
  return runtimePlatform === 'win32'
    ? [
        join(condaPrefix, 'bin'),
        join(condaPrefix, 'Library', 'bin'),
        join(condaPrefix, 'Library', 'usr', 'bin'),
        join(condaPrefix, 'Scripts'),
      ]
    : [join(condaPrefix, 'bin')];
}

function createWindowsBlasAliases(condaPrefix) {
  const libraryDirectory = join(condaPrefix, 'Library', 'lib');
  const blas = join(libraryDirectory, 'blas.lib');
  const lapack = join(libraryDirectory, 'lapack.lib');
  if (existsSync(blas) && existsSync(lapack)) {
    return '';
  }

  const providerLibrary = [
    join(libraryDirectory, 'openblas.lib'),
    join(libraryDirectory, 'mkl_rt.lib'),
  ].find((candidate) => existsSync(candidate));
  if (!providerLibrary) {
    return '';
  }

  const aliasDirectory = join(libraryDirectory, 'setup-fortran-conda');
  mkdirSync(aliasDirectory, { recursive: true });
  copyFileSync(
    existsSync(blas) ? blas : providerLibrary,
    join(aliasDirectory, 'blas.lib'),
  );
  copyFileSync(
    existsSync(lapack) ? lapack : providerLibrary,
    join(aliasDirectory, 'lapack.lib'),
  );
  info(`Created Windows BLAS/LAPACK aliases from ${providerLibrary}`);
  return aliasDirectory;
}

export async function exportCondaEnvironment() {
  await runInGroup(
    'setup-fortran-conda: Configure Conda Environment',
    async () => {
      const condaPrefix = await getCondaPrefix();
      const isWindows = process.platform === 'win32';
      const blasAliasPath = isWindows
        ? createWindowsBlasAliases(condaPrefix)
        : '';
      const libraryPaths = (
        isWindows
          ? [
              blasAliasPath,
              join(condaPrefix, 'Library', 'lib'),
              join(condaPrefix, 'lib'),
            ]
          : [join(condaPrefix, 'lib')]
      ).filter((path) => existsSync(path));
      const includePaths = (
        isWindows
          ? [
              join(condaPrefix, 'opt', 'compiler', 'include', 'intel64'),
              join(condaPrefix, 'Library', 'include'),
            ]
          : [join(condaPrefix, 'include')]
      ).filter((path) => existsSync(path));
      const pkgConfigPaths = (
        isWindows
          ? [
              join(condaPrefix, 'Library', 'lib', 'pkgconfig'),
              join(condaPrefix, 'Library', 'share', 'pkgconfig'),
              join(condaPrefix, 'lib', 'pkgconfig'),
              join(condaPrefix, 'share', 'pkgconfig'),
            ]
          : [
              join(condaPrefix, 'lib', 'pkgconfig'),
              join(condaPrefix, 'share', 'pkgconfig'),
            ]
      ).filter((path) => existsSync(path));
      const cmakePrefixPaths = isWindows
        ? [join(condaPrefix, 'Library'), condaPrefix]
        : [condaPrefix];

      const environment = {
        LIBRARY_PATH: prependPathEntries(
          libraryPaths,
          process.env.LIBRARY_PATH,
        ),
        CMAKE_LIBRARY_PATH: prependPathEntries(
          libraryPaths,
          process.env.CMAKE_LIBRARY_PATH,
        ),
        CMAKE_PREFIX_PATH: prependPathEntries(
          cmakePrefixPaths,
          process.env.CMAKE_PREFIX_PATH,
        ),
        PKG_CONFIG_PATH: prependPathEntries(
          pkgConfigPaths,
          process.env.PKG_CONFIG_PATH,
        ),
      };

      if (process.platform === 'linux') {
        environment.LD_LIBRARY_PATH = prependPathEntries(
          libraryPaths,
          process.env.LD_LIBRARY_PATH,
        );
      } else if (isWindows) {
        environment.LIB = prependPathEntries(libraryPaths, process.env.LIB);
        environment.INCLUDE = prependPathEntries(
          includePaths,
          process.env.INCLUDE,
        );
      }

      exportVariables(environment, { skipEmpty: true });
    },
  );
}

function isTransientCondaError(output) {
  return /CondaHTTPError|HTTP\s+(?:403|408|429|5\d\d)\b|ConnectionError|Connection reset|Temporary failure|timed? out/i.test(
    output,
  );
}

export async function installCondaPackages(
  packages,
  {
    environmentName = TOOLS_ENVIRONMENT_NAME,
    channels = ['conda-forge'],
    command = 'install',
    commandOptions = [],
    groupName = 'setup-fortran-conda: Install Conda Packages',
    successMessage = 'Conda packages installed',
    errorMessage = 'Conda install failed',
  } = {},
) {
  await runInGroup(groupName, async () => {
    const args = [
      command,
      ...commandOptions,
      '--yes',
      '--name',
      environmentName,
      ...packages,
    ];
    for (const channel of channels) {
      args.push('-c', channel);
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let output = '';
      const captureOutput = (data) => {
        output = (output + data.toString()).slice(-32768);
      };

      try {
        await exec('conda', args, {
          listeners: {
            stdout: captureOutput,
            stderr: captureOutput,
          },
        });
        info(successMessage);
        return;
      } catch (error) {
        if (attempt === 2 || !isTransientCondaError(output)) {
          throw new Error(`${errorMessage}: ${getErrorMessage(error)}`, {
            cause: error,
          });
        }
        info('Transient Conda network error; retrying installation');
      }
    }
  });
}

export async function showCondaEnvironment(
  environmentNames = [TOOLS_ENVIRONMENT_NAME],
) {
  await runInGroup('setup-fortran-conda: Show Conda Environment', async () => {
    await exec('conda', ['info']);
    for (const environmentName of environmentNames) {
      await exec('conda', ['list', '--name', environmentName]);
    }
  });
}

export async function addExistingPaths(paths, { log = true } = {}) {
  await runInGroup(
    'setup-fortran-conda: Configure Compiler Paths',
    async () => {
      for (const pathEntry of paths) {
        if (!pathEntry || !existsSync(pathEntry)) {
          continue;
        }

        addPath(pathEntry);
        if (log) {
          info(`Added to PATH: ${pathEntry}`);
        }
      }
    },
  );
}

export async function verifyCommands(commands, lookup) {
  const lookupCommand =
    lookup || (process.platform === 'win32' ? 'where' : 'which');

  await runInGroup(
    'setup-fortran-conda: Verify Compiler Commands',
    async () => {
      for (const { command, args } of commands) {
        await exec(lookupCommand, [command]);
        if (args) {
          await exec(command, args);
        }
      }
    },
  );
}

export function logCompilerSetupComplete() {
  info('Compiler setup complete');
}
