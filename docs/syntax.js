function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function token(type, value) {
  return `<span class="syntax-${type}">${escapeHtml(value)}</span>`;
}

function highlightValue(value) {
  let output = '';
  let plain = '';

  function flushPlain() {
    if (!plain) return;
    output += escapeHtml(plain).replace(
      /\b(true|false|null|latest)\b/g,
      '<span class="syntax-literal">$1</span>'
    );
    plain = '';
  }

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (value.startsWith('${{', index)) {
      flushPlain();
      const end = value.indexOf('}}', index + 3);
      const stop = end < 0 ? value.length : end + 2;
      output += token('expression', value.slice(index, stop));
      index = stop - 1;
      continue;
    }

    if (character === '"' || character === "'") {
      flushPlain();
      let stop = index + 1;
      while (stop < value.length) {
        if (value[stop] === character && value[stop - 1] !== '\\') {
          stop += 1;
          break;
        }
        stop += 1;
      }
      output += token('string', value.slice(index, stop));
      index = stop - 1;
      continue;
    }

    if (character === '#') {
      flushPlain();
      output += token('comment', value.slice(index));
      break;
    }

    plain += character;
  }

  flushPlain();
  return output;
}

function highlightYaml(source) {
  return source
    .split('\n')
    .map((line) => {
      const key = line.match(/^(\s*(?:-\s+)?)([A-Za-z_][A-Za-z0-9_.-]*)(:)(.*)$/);
      if (!key) return highlightValue(line);

      return (
        escapeHtml(key[1]) +
        token('key', key[2]) +
        token('punctuation', key[3]) +
        highlightValue(key[4])
      );
    })
    .join('\n');
}

for (const code of document.querySelectorAll('pre code.language-yaml')) {
  code.innerHTML = highlightYaml(code.textContent);
}
