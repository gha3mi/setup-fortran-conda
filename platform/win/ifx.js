import {
  startGroup,
  endGroup,
  addPath,
  exportVariable,
  info,
} from '@actions/core';
import { exec as _exec } from '@actions/exec';
import { sep, join } from 'path';
import { existsSync, readdirSync } from 'fs';

async function getCondaPrefix(envName) {
  let raw = '';
  await _exec('conda', ['env', 'list', '--json'], {
    silent: true,
    listeners: { stdout: d => (raw += d.toString()) },
  });
  const { envs } = JSON.parse(raw);
  for (const p of envs) {
    if (p.endsWith(sep + envName) || p.endsWith('/' + envName)) return p;
  }
  throw new Error(`Unable to locate Conda environment "${envName}".`);
}

async function ensureMsvcLinkerInPath(prefix) {
  startGroup('Adding MSVC linker and libraries to PATH/LIB');

  const libPaths = [];

  const vcInstall = process.env.VCINSTALLDIR;
  if (
    vcInstall &&
    existsSync(join(vcInstall, 'bin', 'Hostx64', 'x64', 'link.exe'))
  ) {
    const binPath = join(vcInstall, 'bin', 'Hostx64', 'x64');
    const libPath = join(vcInstall, 'lib', 'x64');
    addPath(binPath);
    libPaths.push(libPath);
    info(`Found VC tools via VCINSTALLDIR → ${vcInstall}`);
  } else {
    let vsPath = '';
    await _exec(
      'vswhere',
      [
        '-latest',
        '-products',
        '*',
        '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property',
        'installationPath',
      ],
      { silent: true, listeners: { stdout: d => (vsPath += d.toString()) } }
    );
    vsPath = vsPath.trim();
    if (!vsPath) throw new Error('vswhere did not return any Visual Studio path.');

    const msvcRoot = join(vsPath, 'VC', 'Tools', 'MSVC');
    const versions = readdirSync(msvcRoot).sort().reverse();
    if (!versions.length) throw new Error('No MSVC toolsets found.');

    const msvcBin = join(msvcRoot, versions[0], 'bin', 'Hostx64', 'x64');
    const msvcLib = join(msvcRoot, versions[0], 'lib', 'x64');
    addPath(msvcBin);
    libPaths.push(msvcLib);
    info(`Added MSVC linker from ${msvcBin}`);
  }

  const intelLib = join(prefix, 'Library', 'lib');
  libPaths.unshift(intelLib);

  const sdkBase = join(process.env['ProgramFiles(x86)'], 'Windows Kits', '10', 'Lib');
  if (existsSync(sdkBase)) {
    const sdkVersions = readdirSync(sdkBase)
      .filter(name => /^\d+\.\d+\.\d+\.\d+$/.test(name))
      .sort()
      .reverse();
    if (sdkVersions.length > 0) {
      const version = sdkVersions[0];
      const umLib = join(sdkBase, version, 'um', 'x64');
      const ucrtLib = join(sdkBase, version, 'ucrt', 'x64');
      libPaths.push(umLib, ucrtLib);
      info(`Added Windows SDK paths:\n- ${umLib}\n- ${ucrtLib}`);
    }
  }

  exportVariable('LIB', libPaths.join(';'));
  await _exec('where', ['link']);
  endGroup();
}

export async function setup() {
  const packageName = ['ifx_win-64', 'intel-fortran-rt'];

  startGroup('Conda install');
  await _exec('conda', [
    'install',
    '--yes',
    '--name',
    'fortran',
    ...packageName,
    '-c',
    'conda-forge',
  ]);
  endGroup();

  const prefix = await getCondaPrefix('fortran');
  await ensureMsvcLinkerInPath(prefix);

  startGroup('Environment setup');
  addPath(join(prefix, 'bin'));
  addPath(join(prefix, 'Library', 'bin'));
  endGroup();

}
