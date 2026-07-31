import { exec } from '@actions/exec';
import { getErrorMessage } from './errors.js';

export async function captureCommand(command, args = []) {
  let stdout = '';
  let stderr = '';

  try {
    const exitCode = await exec(command, args, {
      silent: true,
      ignoreReturnCode: true,
      listeners: {
        stdout: (data) => {
          stdout += data.toString();
        },
        stderr: (data) => {
          stderr += data.toString();
        },
      },
    });

    return { stdout, stderr, exitCode };
  } catch (error) {
    return {
      stdout,
      stderr: [stderr, getErrorMessage(error)].filter(Boolean).join('\n'),
      exitCode: 1,
    };
  }
}
