import { getInput, setFailed, summary } from '@actions/core';
import { exec as _exec } from '@actions/exec';

async function getVersion(cmd, args = ['--version']) {
  let output = '';
  try {
    await _exec(cmd, args, {
      listeners: {
        stdout: data => output += data.toString()
      }
    });
    return output.split('\n')[0].trim();
  } catch {
    return 'Unknown';
  }
}

async function run() {
  try {
    const compiler = getInput('compiler', { required: true }).toLowerCase();
    const platform = getInput('platform', { required: true }).toLowerCase();
    const extrasInput = getInput('extra-packages') || '';

    const osKey = platform.includes('ubuntu') ? 'lin'
      : platform.includes('windows') ? 'win'
        : platform.includes('macos') ? 'mac'
          : undefined;
    if (!osKey) throw new Error(`Unsupported platform: ${platform}`);

    // Install extra packages
    const { installExtras } = await import('./extra.js');
    const extras = extrasInput.split(',').map(p => p.trim()).filter(Boolean);
    await installExtras('fortran', extras);

    // install compiler
    const { setup } = await import(`./platform/${osKey}/${compiler}.js`);
    await setup();

    // Get versions
    const compilerVersion = await getVersion(compiler);
    const fpmVersion = await getVersion('fpm');

    // GitHub Actions job summary only
    await summary
      .addTable([
        ['OS', 'Compiler', 'Version', 'FPM Version'],
        [platform, compiler, compilerVersion, fpmVersion]
      ])
      .write();

  } catch (err) {
    setFailed(err.message);
  }
}

run();
