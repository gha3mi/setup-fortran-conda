import { setFailed, summary } from '@actions/core';
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
    const compiler = (process.env.INPUT_COMPILER || '').toLowerCase();
    const version = process.env.INPUT_COMPILER_VERSION || '';
    const platform = (process.env.INPUT_PLATFORM || '').toLowerCase();
    const extrasInput = process.env.INPUT_EXTRA_PACKAGES || '';
    const fpmVersion = process.env.INPUT_FPM_VERSION || '';

    const osKey = platform.includes('ubuntu') ? 'lin'
      : platform.includes('windows') ? 'win'
        : platform.includes('macos') ? 'mac'
          : undefined;
    if (!osKey) throw new Error(`Unsupported platform: ${platform}`);

    // Install extra packages
    const { installExtras } = await import('./extra.js');
    const extras = extrasInput
      .split(/[\s,]+/)
      .map(p => p.trim())
      .filter(Boolean);
    await installExtras('fortran', extras, fpmVersion);

    // Install compiler
    const { setup } = await import(`./platform/${osKey}/${compiler}.js`);
    await setup(version);

    // Get compiler version
    const compilerVersion = await getVersion(compiler);

    // Write GitHub Actions summary
    await summary
      .addTable([
        ['OS', 'Compiler', 'Version'],
        [platform, compiler, compilerVersion]
      ])
      .write();

  } catch (err) {
    setFailed(err.message);
  }
}

run();
