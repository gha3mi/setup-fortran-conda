import { info } from '@actions/core';
import { exec } from '@actions/exec';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { exportEnvironmentVariables, runInGroup } from './action.js';
import { captureCommand } from './command.js';
import { prependPathEntries } from './environment.js';
import { getErrorMessage } from './errors.js';

export const TOOLS_ENVIRONMENT_NAME = 'fortran';
export const CONDA_FORGE_CHANNEL = 'conda-forge';
export const INTEL_CONDA_CHANNEL =
  'https://software.repos.intel.com/python/conda/';

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

export async function listCondaPackages(
  environmentName = TOOLS_ENVIRONMENT_NAME,
  { description = 'Conda', packageName = '' } = {},
) {
  const result = await captureCommand('conda', [
    'list',
    '--name',
    environmentName,
    ...(packageName ? [packageName] : []),
    '--json',
  ]);
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect ${description} packages: ${result.stderr || result.stdout}`,
    );
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(
      `Unable to parse installed ${description} packages: ${getErrorMessage(error)}`,
      { cause: error },
    );
  }
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

      exportEnvironmentVariables(environment, { skipEmpty: true });
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
    channels = [CONDA_FORGE_CHANNEL],
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
