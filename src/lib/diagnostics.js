const COMMAND_NOT_FOUND_PATTERN =
  /Unable to locate executable file|not found|ENOENT|is not recognized as an internal or external command/i;

export function isCommandNotFoundOutput(value) {
  return COMMAND_NOT_FOUND_PATTERN.test(String(value || ''));
}
