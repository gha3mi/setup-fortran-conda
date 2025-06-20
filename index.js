import { getInput, setFailed } from '@actions/core';
import { exec as _exec } from '@actions/exec';

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

  } catch (err) {
    setFailed(err.message);
  }
}

run();
