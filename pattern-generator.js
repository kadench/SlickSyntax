'use strict';

(function exposePatternGenerator(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SlickSyntaxPattern = api;
})(typeof globalThis === 'object' ? globalThis : this, function createPatternGenerator() {
  const tokenDefinitions = {
    ':start:': { docs: '^', python: '^' },
    ':end:': { docs: '$', python: '$' },
    ':boundary:': { docs: '\\b', python: '\\b' },
    ':any:': { docs: '.', word: '?', python: '.' },
    ':digits:': { docs: '\\d+', word: '[0-9]@', python: '\\d+' },
    ':wstart:': { word: '<' },
    ':wend:': { word: '>' },
    ':para:': { word: '^13' },
    ':break:': { docs: '\\n', word: '^l', python: '\\n' },
  };

  const tokenAliases = Object.keys(tokenDefinitions).sort((a, b) => b.length - a.length);

  function escapeDocs(character) {
    if (character === '\0') return '\\x00';
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\u00a0') return '\\x{A0}';
    const codePoint = character.codePointAt(0);
    if (codePoint < 0x20 || codePoint === 0x7f) {
      return '\\x' + codePoint.toString(16).toUpperCase().padStart(2, '0');
    }
    return /[\\.^$|?*+()[\]{}]/u.test(character) ? '\\' + character : character;
  }

  function escapeWord(character) {
    if (character === '\t') return '^t';
    if (character === '\n') return '^l';
    if (character === '\r') return '^13';
    if (character === '\u00a0') return '^s';
    return /[\\?*()[\]{}@<>]/u.test(character) ? '\\' + character : character;
  }

  function escapePython(character) {
    if (character === '\0') return '\\x00';
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\u00a0') return '\\u00A0';
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      return '\\u' + codePoint.toString(16).toUpperCase().padStart(4, '0');
    }
    if (codePoint < 0x20 || codePoint === 0x7f) {
      return '\\x' + codePoint.toString(16).toUpperCase().padStart(2, '0');
    }
    return /[\\.^$|?*+()[\]{}]/u.test(character) ? '\\' + character : character;
  }

  function generatePattern(target, input, options = {}) {
    if (target !== 'docs' && target !== 'word' && target !== 'python') {
      throw new TypeError('Target must be "docs", "word", or "python".');
    }

    const sample = String(input ?? '');
    const digits = options.digits !== false;
    const whitespace = options.whitespace !== false;
    const escapeCharacter = target === 'docs'
      ? escapeDocs
      : target === 'word'
        ? escapeWord
        : escapePython;
    let output = '';

    for (let index = 0; index < sample.length;) {
      if (sample[index] === '{') {
        const close = sample.indexOf('}', index + 1);
        if (close !== -1) {
          output += Array.from(sample.slice(index + 1, close), escapeCharacter).join('');
          index = close + 1;
          continue;
        }
      }

      const alias = tokenAliases.find(
        (candidate) => sample.startsWith(candidate, index) && tokenDefinitions[candidate][target],
      );
      if (alias) {
        output += tokenDefinitions[alias][target];
        index += alias.length;
        continue;
      }

      const character = String.fromCodePoint(sample.codePointAt(index));
      if (character === '?') {
        output += target === 'word' ? '?' : '.';
        index += 1;
        continue;
      }
      if (/[a-z]/u.test(character)) {
        while (index < sample.length && /[a-z]/u.test(sample[index])) index += 1;
        output += target === 'word' ? '[a-z]@' : '[a-z]+';
        continue;
      }
      if (/[A-Z]/u.test(character)) {
        while (index < sample.length && /[A-Z]/u.test(sample[index])) index += 1;
        output += target === 'word' ? '[A-Z]@' : '[A-Z]+';
        continue;
      }
      if (digits && /[0-9]/u.test(character)) {
        while (index < sample.length && /[0-9]/u.test(sample[index])) index += 1;
        output += target === 'word' ? '[0-9]@' : '\\d+';
        continue;
      }
      if (whitespace && /[ \t\u00a0]/u.test(character)) {
        let part = '';
        while (index < sample.length && /[ \t\u00a0]/u.test(sample[index])) part += sample[index++];
        if (target === 'docs') output += '[ \\t\\x{A0}]+';
        else if (target === 'python') output += '[ \\t\\u00A0]+';
        else if (/^ +$/u.test(part)) output += ' @';
        else output += Array.from(part, escapeCharacter).join('');
        continue;
      }

      output += escapeCharacter(character);
      index += character.length;
    }

    return output;
  }

  return { generatePattern, escapeDocs, escapeWord, escapePython, tokenDefinitions };
});
