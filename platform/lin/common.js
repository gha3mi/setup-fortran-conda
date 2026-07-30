import { info } from '@actions/core';
import { appendFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { join } from 'node:path';
import { assertPlatform, exportEnv, grouped } from '../common.js';

export * from '../common.js';

export function assertLinux(
  message = 'This setup script is only supported on Linux.'
) {
  assertPlatform('linux', message);
}

export async function setLinuxUlimits() {
  await grouped('setup-fortran-conda: Configure Linux Environment', async () => {
    const command =
      'ulimit -c unlimited -d unlimited -f unlimited -m unlimited -s unlimited -t unlimited -v unlimited -x unlimited';
    const script = join(process.env.RUNNER_TEMP, 'ulimit.sh');
    appendFileSync(script, `${command}${EOL}`);
    exportEnv('BASH_ENV', script);
    info('ulimit settings exported to BASH_ENV');
  });
}
