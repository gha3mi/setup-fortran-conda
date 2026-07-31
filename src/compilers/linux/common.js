import { info } from '@actions/core';
import { appendFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { join } from 'node:path';
import {
  addExistingPaths,
  assertPlatform,
  createCompilerEnvironment,
  createCompilerVerificationCommands,
  exportCompilerEnvironment,
  exportEnvironmentVariable,
  getCondaPrefix,
  installCondaCompilerPackages,
  logCompilerSetupComplete,
  prependPathEntries,
  runInGroup,
  verifyCommands,
} from '../common.js';

export * from '../common.js';

export function assertLinux(
  message = 'This setup script is only supported on Linux.',
) {
  assertPlatform('linux', message);
}

export async function setupCondaCompiler({
  version = '',
  versionedPackages = [],
  packages = [],
  channels,
  compilers,
  additionalVerificationCommands = [],
  environment = {},
}) {
  assertLinux();

  await installCondaCompilerPackages({
    version,
    versionedPackages,
    packages,
    channels,
  });

  const condaPrefix = await getCondaPrefix();
  await configureLinuxCompiler({
    paths: [join(condaPrefix, 'bin')],
    compilers,
    verificationCommands: createCompilerVerificationCommands(
      compilers,
      additionalVerificationCommands,
    ),
    environment: {
      ...environment,
      LD_LIBRARY_PATH: prependPathEntries(
        [join(condaPrefix, 'lib')],
        process.env.LD_LIBRARY_PATH,
      ),
    },
  });
}

export async function configureLinuxCompiler({
  paths,
  compilers,
  environment = {},
  verificationCommands,
}) {
  assertLinux();

  await addExistingPaths(paths);
  await verifyCommands(
    verificationCommands || createCompilerVerificationCommands(compilers),
  );
  await exportCompilerEnvironment(
    createCompilerEnvironment(
      compilers.fortran,
      compilers.c,
      compilers.cxx,
      environment,
    ),
  );
  await configureLinuxUlimits();

  logCompilerSetupComplete();
}

export async function configureLinuxUlimits() {
  await runInGroup(
    'setup-fortran-conda: Configure Linux Environment',
    async () => {
      const command =
        'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
      const script = join(process.env.RUNNER_TEMP, 'ulimit.sh');
      appendFileSync(script, `${command}${EOL}`);
      exportEnvironmentVariable('BASH_ENV', script);
      info('ulimit settings exported to BASH_ENV');
    },
  );
}
