import { captureCommand, combineCommandOutput } from './command.js';
import { isCommandNotFoundOutput } from './diagnostics.js';
import { firstLine, firstVersion } from './version.js';

const TOOL_VERSION_PROBES = Object.freeze({
  fpm: Object.freeze({ command: 'fpm', args: ['--version'] }),
  cmake: Object.freeze({ command: 'cmake', args: ['--version'] }),
  meson: Object.freeze({ command: 'meson', args: ['--version'] }),
});

function extractAoccVersion(value) {
  const match = String(value || '').match(
    /\bAOCC[_\s-]*(\d+(?:\.\d+){1,3})\b/i,
  );
  return match?.[1] || '';
}

function createCompilerVersionProbes(compilerBinary, compiler) {
  const probes = [];

  if (compiler === 'gfortran') {
    probes.push(
      [compilerBinary, ['-dumpfullversion', '-dumpversion']],
      [compilerBinary, ['-dumpversion']],
    );
  }

  if (compiler === 'aocc') {
    probes.push(
      ['amdclang', ['-v']],
      ['amdclang', ['--version']],
      ['amdflang', ['--version']],
    );
  }

  probes.push(
    [compilerBinary, ['--version']],
    [compilerBinary, ['-V']],
    [compilerBinary, ['-v']],
  );

  return probes;
}

function readProbeOutput(result) {
  return {
    output: combineCommandOutput(result),
    rawFirstLine: firstLine(result.stdout) || firstLine(result.stderr),
  };
}

export async function detectCompilerVersion(compilerBinary, compiler) {
  const probes = createCompilerVersionProbes(compilerBinary, compiler);

  for (const [command, args] of probes) {
    const result = await captureCommand(command, args);
    const { output, rawFirstLine } = readProbeOutput(result);

    if (
      result.exitCode !== 0 &&
      isCommandNotFoundOutput(output || rawFirstLine)
    ) {
      return {
        actual_version: 'Not found',
        raw_first_line: rawFirstLine || firstLine(output) || 'Not found',
      };
    }

    let actualVersion;
    if (compiler === 'aomp' && process.env.AOMP_VERSION) {
      actualVersion = process.env.AOMP_VERSION;
    } else if (compiler === 'aocc') {
      actualVersion =
        extractAoccVersion(output) ||
        extractAoccVersion(rawFirstLine) ||
        firstVersion(output) ||
        firstVersion(rawFirstLine);
    } else {
      actualVersion = firstVersion(output) || firstVersion(rawFirstLine);
    }

    if (result.exitCode === 0 || rawFirstLine) {
      return {
        actual_version: actualVersion || rawFirstLine || 'Unknown',
        raw_first_line: rawFirstLine || 'Unknown',
      };
    }
  }

  return {
    actual_version: 'Unknown',
    raw_first_line: 'Unknown',
  };
}

export async function detectToolVersion(tool) {
  const probe = TOOL_VERSION_PROBES[tool];
  if (!probe) {
    return null;
  }

  const result = await captureCommand(probe.command, probe.args);
  const { output, rawFirstLine } = readProbeOutput(result);

  if (
    result.exitCode !== 0 &&
    isCommandNotFoundOutput(output || rawFirstLine)
  ) {
    return 'Not found';
  }
  if (result.exitCode !== 0 && !rawFirstLine) {
    return 'Unknown';
  }

  return firstVersion(output) || rawFirstLine || 'Unknown';
}
