function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function createToken(type, value) {
  return `<span class="syntax-${type}">${escapeHtml(value)}</span>`;
}

function highlightValue(value) {
  let output = '';
  let plain = '';

  function flushPlain() {
    if (!plain) {
      return;
    }
    output += escapeHtml(plain).replace(
      /\b(true|false|null|latest)\b/g,
      '<span class="syntax-literal">$1</span>',
    );
    plain = '';
  }

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (value.startsWith('${{', index)) {
      flushPlain();
      const expressionEnd = value.indexOf('}}', index + 3);
      const tokenEnd = expressionEnd < 0 ? value.length : expressionEnd + 2;
      output += createToken('expression', value.slice(index, tokenEnd));
      index = tokenEnd - 1;
      continue;
    }

    if (character === '"' || character === "'") {
      flushPlain();
      let tokenEnd = index + 1;
      while (tokenEnd < value.length) {
        if (value[tokenEnd] === character && value[tokenEnd - 1] !== '\\') {
          tokenEnd += 1;
          break;
        }
        tokenEnd += 1;
      }
      output += createToken('string', value.slice(index, tokenEnd));
      index = tokenEnd - 1;
      continue;
    }

    if (character === '#') {
      flushPlain();
      output += createToken('comment', value.slice(index));
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
      const keyMatch = line.match(
        /^(\s*(?:-\s+)?)([A-Za-z_][A-Za-z0-9_.-]*)(:)(.*)$/,
      );
      if (!keyMatch) {
        return highlightValue(line);
      }

      return (
        escapeHtml(keyMatch[1]) +
        createToken('key', keyMatch[2]) +
        createToken('punctuation', keyMatch[3]) +
        highlightValue(keyMatch[4])
      );
    })
    .join('\n');
}

for (const codeBlock of document.querySelectorAll('pre code.language-yaml')) {
  codeBlock.innerHTML = highlightYaml(codeBlock.textContent);
}
