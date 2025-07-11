import {
    startGroup,
    endGroup,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep } from 'path';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function getCondaPrefix(envName) {
    let raw = '';
    await _exec('conda', ['env', 'list', '--json'], {
        silent: true,
        listeners: { stdout: (d) => (raw += d.toString()) },
    });
    const { envs } = JSON.parse(raw);
    for (const p of envs) {
        if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
    }
    throw new Error(`Unable to locate Conda environment "${envName}".`);
}

async function exportActivatedCondaEnv(envName) {
    const scriptPath = path.join(os.tmpdir(), 'export-conda-env.sh');

    fs.writeFileSync(scriptPath, `#!/usr/bin/env bash
set -eo pipefail

source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate ${envName}

printenv | while IFS="=" read -r line; do
  key="\${line%%=*}"
  value="\${line#*=}"
  [ -z "\$key" ] && continue
  # Properly escape values with special characters
  printf '%s=%q\n' "\$key" "\$value" >> "\$GITHUB_ENV"
done
`);

    console.log(`Written export script to: ${scriptPath}`);
    console.log(fs.readFileSync(scriptPath, 'utf8'));

    await _exec('bash', [scriptPath]);
}

export async function setup(version = '') {
    const packageList = version
        ? [`gfortran=${version}`, 'mpich']
        : ['gfortran', 'mpich'];

    startGroup('Conda install');
    await _exec('conda', [
        'install',
        '--yes',
        '--name',
        'fortran',
        '-c',
        'conda-forge',
        ...packageList,
    ]);
    endGroup();

    await exportActivatedCondaEnv('fortran');
}
