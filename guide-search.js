'use strict';

(function exposeGuideSearch(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SlickSyntaxGuideSearch = api;
})(typeof globalThis === 'object' ? globalThis : this, function createGuideSearch() {
  const namedCharacters = new Map([
    ['nul', '\0'],
    ['null', '\0'],
    ['tab', '\t'],
    ['horizontal tab', '\t'],
    ['line feed', '\n'],
    ['newline', '\n'],
    ['carriage return', '\r'],
    ['space', ' '],
    ['regular space', ' '],
    ['non-breaking space', '\u00a0'],
    ['nonbreaking space', '\u00a0'],
    ['nbsp', '\u00a0'],
  ]);

  const characterNames = new Map([
    [0x00, 'NULL'],
    [0x09, 'HORIZONTAL TAB'],
    [0x0a, 'LINE FEED'],
    [0x0d, 'CARRIAGE RETURN'],
    [0x20, 'SPACE'],
    [0x21, 'EXCLAMATION MARK'],
    [0x22, 'QUOTATION MARK'],
    [0x23, 'NUMBER SIGN'],
    [0x24, 'DOLLAR SIGN'],
    [0x25, 'PERCENT SIGN'],
    [0x26, 'AMPERSAND'],
    [0x27, 'APOSTROPHE'],
    [0x28, 'LEFT PARENTHESIS'],
    [0x29, 'RIGHT PARENTHESIS'],
    [0x2a, 'ASTERISK'],
    [0x2b, 'PLUS SIGN'],
    [0x2c, 'COMMA'],
    [0x2d, 'HYPHEN-MINUS'],
    [0x2e, 'FULL STOP'],
    [0x2f, 'SOLIDUS'],
    [0x3a, 'COLON'],
    [0x3b, 'SEMICOLON'],
    [0x3c, 'LESS-THAN SIGN'],
    [0x3d, 'EQUALS SIGN'],
    [0x3e, 'GREATER-THAN SIGN'],
    [0x3f, 'QUESTION MARK'],
    [0x40, 'COMMERCIAL AT'],
    [0x5b, 'LEFT SQUARE BRACKET'],
    [0x5c, 'REVERSE SOLIDUS'],
    [0x5d, 'RIGHT SQUARE BRACKET'],
    [0x5e, 'CIRCUMFLEX ACCENT'],
    [0x5f, 'LOW LINE'],
    [0x60, 'GRAVE ACCENT'],
    [0x7b, 'LEFT CURLY BRACKET'],
    [0x7c, 'VERTICAL LINE'],
    [0x7d, 'RIGHT CURLY BRACKET'],
    [0x7e, 'TILDE'],
    [0x00a0, 'NO-BREAK SPACE'],
  ]);

  function validCodePoint(value) {
    return Number.isInteger(value) && value >= 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff);
  }

  function fromCodePoint(value) {
    return validCodePoint(value) ? String.fromCodePoint(value) : null;
  }

  function oneCharacter(value) {
    const characters = Array.from(value);
    return characters.length === 1 ? characters[0] : null;
  }

  function parseCharacterQuery(rawQuery) {
    const raw = String(rawQuery ?? '');
    if (!raw) return null;

    if (oneCharacter(raw) && (/\s/u.test(raw) || !/[0-9]/u.test(raw))) {
      return characterInfo(raw);
    }

    const trimmed = raw.trim();
    const named = namedCharacters.get(trimmed.toLowerCase());
    if (named !== undefined) return characterInfo(named);

    const escaped = new Map([
      ['\\0', '\0'],
      ['\\t', '\t'],
      ['\\n', '\n'],
      ['\\r', '\r'],
    ]).get(trimmed.toLowerCase());
    if (escaped !== undefined) return characterInfo(escaped);

    const quoted = trimmed.match(/^(?:"([\s\S])"|'([\s\S])')$/u);
    if (quoted) return characterInfo(quoted[1] ?? quoted[2]);

    let value = null;
    if (/^[0-9]{2,7}$/u.test(trimmed)) value = Number(trimmed);
    else if (/^u\+[0-9a-f]{1,6}$/iu.test(trimmed)) value = Number.parseInt(trimmed.slice(2), 16);
    else if (/^0x[0-9a-f]{1,6}$/iu.test(trimmed)) value = Number.parseInt(trimmed.slice(2), 16);
    else if (/^\\u\{[0-9a-f]{1,6}\}$/iu.test(trimmed)) value = Number.parseInt(trimmed.slice(3, -1), 16);
    else if (/^\\u[0-9a-f]{4}$/iu.test(trimmed)) value = Number.parseInt(trimmed.slice(2), 16);
    else if (/^&#[0-9]{1,7};?$/u.test(trimmed)) value = Number.parseInt(trimmed.slice(2), 10);
    else if (/^&#x[0-9a-f]{1,6};?$/iu.test(trimmed)) value = Number.parseInt(trimmed.slice(3), 16);

    const decoded = value === null ? null : fromCodePoint(value);
    if (decoded !== null) return characterInfo(decoded);

    const literal = oneCharacter(trimmed);
    return literal ? characterInfo(literal) : null;
  }

  function displayCharacter(character, codePoint) {
    if (codePoint === 0) return '\\0';
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === ' ') return 'space';
    if (character === '\u00a0') return 'non-breaking space';
    return character;
  }

  function categoryTerms(character) {
    if (/\p{Letter}/u.test(character)) return ['letter', 'alphabet', 'word character', 'any character'];
    if (/\p{Number}/u.test(character)) return ['number', 'digit', 'numeric', 'word character', 'any character'];
    if (/\p{White_Space}/u.test(character)) return ['whitespace', 'space', 'blank', 'any character'];
    if (character === '_') return ['underscore', 'word character', 'any character'];
    if (/\p{Punctuation}/u.test(character)) return ['punctuation', 'nonword', 'not a word character', 'any character'];
    if (/\p{Symbol}/u.test(character)) return ['symbol', 'nonword', 'not a word character', 'any character'];
    return ['control character', 'nonword', 'any character'];
  }

  function characterInfo(character) {
    const codePoint = character.codePointAt(0);
    if (!validCodePoint(codePoint)) return null;
    const hex = codePoint.toString(16).toUpperCase().padStart(codePoint <= 0xffff ? 4 : 6, '0');
    const name = characterNames.get(codePoint) || (
      /\p{Letter}/u.test(character) ? 'LETTER' :
      /\p{Number}/u.test(character) ? 'NUMBER' :
      /\p{Punctuation}/u.test(character) ? 'PUNCTUATION' :
      /\p{Symbol}/u.test(character) ? 'SYMBOL' :
      /\p{White_Space}/u.test(character) ? 'WHITESPACE' : 'CHARACTER'
    );
    const display = displayCharacter(character, codePoint);
    const relatedTerms = [
      character,
      display,
      name,
      ...categoryTerms(character),
    ];
    const terms = [
      ...relatedTerms,
      String(codePoint),
      'U+' + hex,
      '0x' + hex,
      '&#' + codePoint + ';',
      '&#x' + hex + ';',
    ];
    return { character, codePoint, hex, name, display, terms, relatedTerms };
  }

  function escapeDocs(character) {
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\u00a0') return '\\x{A0}';
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

  function makeCharacterRow(info) {
    return [
      'Character: ' + info.display,
      info.terms.join(' '),
      escapeDocs(info.character),
      escapeWord(info.character),
      escapePython(info.character),
      info.name + ' · U+' + info.hex + ' · decimal ' + info.codePoint,
    ];
  }

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFKC')
      .replace(/\0/gu, ' null nul u+0000 0 ')
      .replace(/\t/gu, ' tab horizontal-tab u+0009 9 ')
      .replace(/\r/gu, ' carriage-return u+000d 13 ')
      .replace(/\n/gu, ' line-feed newline u+000a 10 ')
      .replace(/\u00a0/gu, ' non-breaking-space nbsp u+00a0 160 ')
      .toLowerCase()
      .replace(/[\s_-]+/gu, ' ')
      .trim();
  }

  function queryGroups(rawQuery) {
    const raw = String(rawQuery ?? '');
    if (parseCharacterQuery(raw)) return [raw];
    return raw
      .split(/[\r\n\t,;]+/u)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function parseCharacterQueries(rawQuery) {
    const raw = String(rawQuery ?? '');
    const hasListDelimiter = /[\r\n\t,;]/u.test(raw);
    const single = hasListDelimiter ? null : parseCharacterQuery(raw);
    if (single) return [single];

    let candidates = [];
    const containsLiteralTab = raw.includes('\t');
    const explicitParts = raw.split(/[\r\n\t,;]+/u).map((part) => part.trim()).filter(Boolean);
    if (explicitParts.length > 1 || containsLiteralTab || /[\r\n,;]/u.test(raw)) {
      candidates = explicitParts.map(parseCharacterQuery).filter(Boolean);
    } else if (/^[^\p{Letter}\p{Number}\s]{2,16}$/u.test(raw)) {
      candidates = Array.from(raw, characterInfo).filter(Boolean);
    }
    if (containsLiteralTab) candidates.push(characterInfo('\t'));

    const seen = new Set();
    return candidates.filter((info) => {
      if (seen.has(info.codePoint)) return false;
      seen.add(info.codePoint);
      return true;
    });
  }

  function rowMatches(row, rawQuery, characterQueries) {
    const index = normalize(row.join(' '));
    if (!index && !rawQuery) return true;
    if (characterQueries.some((info) => info.relatedTerms.some((term) => {
      const normalized = normalize(term);
      return normalized && index.includes(normalized);
    }))) return true;

    const groups = queryGroups(rawQuery);
    return groups.some((group) => {
      const normalized = normalize(group);
      if (!normalized) return false;
      if (index.includes(normalized)) return true;
      return normalized.split(' ').every((word) => index.includes(word));
    });
  }

  function searchGuide(rows, rawQuery) {
    const query = String(rawQuery ?? '');
    if (!query) {
      return { matches: rows.slice(), characterRows: [], characterRow: null, character: null };
    }
    const characters = parseCharacterQueries(query);
    const characterRows = characters.map(makeCharacterRow);
    return {
      matches: rows.filter((row) => rowMatches(row, query, characters)),
      characterRows,
      characterRow: characterRows[0] || null,
      character: characters[0] || null,
    };
  }

  function formatNoResults(rawQuery) {
    return 'No results found for ?q=' + JSON.stringify(String(rawQuery ?? ''));
  }

  return {
    parseCharacterQuery,
    parseCharacterQueries,
    makeCharacterRow,
    searchGuide,
    formatNoResults,
    escapeDocs,
    escapeWord,
    escapePython,
    normalize,
  };
});
