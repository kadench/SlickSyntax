'use strict';
const $ = (id) => document.getElementById(id);
const TARGETS = ['docs', 'word', 'python'];
const TARGET_LABELS = {
  docs: 'Google Docs',
  word: 'Microsoft Word',
  python: 'Python re',
};
const state = { docs: {}, word: {}, python: {}, guide: 'docs', page: 'docs' };
const privateSessions = { docs: false, word: false, python: false };
const baseGuide = [
['Any digit','3 7 0123456789 number digit','\\d','[0-9]','Matches a single digit'],
['One or more digits','123 42 number digits numeric','\\d+','[0-9]@','Matches a run of digits'],
['Not a digit','abc nondigit','\\D','[!0-9]','Matches a non-digit character'],
['Any letter','abc xyz alphabet letter','[A-Za-z]','[A-Za-z]','One ASCII letter'],
['Any word character','abc_123 word underscore','\\w','[A-Za-z0-9_]','Letter, digit, or underscore'],
['Not a word character','punctuation nonword','\\W','[!A-Za-z0-9_]','Non-word character'],
['Any whitespace','space tab whitespace blank','\\s','Not directly available','A whitespace character (Word: spaces/tabs only)'],
['One or more whitespace','  tab whitespace multiple','\\s+','Not directly available','A run of spaces/tabs (Docs also matches other whitespace)'],
['Space','  space U+0020',' ',' ','Literal regular space'],
['Tab','\t tab U+0009 horizontal tab','\\t','^t','Horizontal tab; in Word Find, ^t may require wildcards off'],
['Non-breaking space','  nbsp U+00A0 no break space','\\x{A0}','^s','Non-breaking space; Word uses a special character code'],
['Line feed','\n newline line break U+000A','\\n','^l','Line feed; Word uses ^l for manual line break'],
['Carriage return / paragraph','\r paragraph newline U+000D','\\r','^13','Word paragraph mark in wildcard mode; Word behavior varies by context'],
['Any character','x any dot wildcard','.','?','One arbitrary character'],
['Zero or more','* asterisk repeat','a*','a*','Repeat preceding item zero or more times (Word * has different semantics)'],
['One or more','+ plus repeat','a+','a@','Repeat preceding item one or more times'],
['Optional','? question zero one','a?','a{0,1}','Docs optional character; Word repetition rules differ'],
['Exactly N','{3} repeat count','a{3}','a{3}','Exactly three occurrences'],
['At least N','{3,} repeat minimum','a{3,}','a{3,}','At least three occurrences'],
['Between N and M','{2,5} repeat range','a{2,5}','a{2,5}','Two to five occurrences'],
['Character set','[abc] set either','[abc]','[abc]','Any one character in this set'],
['Negated set','[^abc] exclude not','[^abc]','[!abc]','Any one character except those listed'],
['Either / alternation','| or pipe','cat|dog','Not available','Word has no direct alternation operator'],
['Grouping','(abc) capture','(abc)','(abc)','Group a sequence of characters'],
['Non-capturing group','(?:abc) group','(?:abc)','Not available','Noncapturing groups are RE2 syntax'],
['Start of line','^ caret beginning start','^','Not direct','Start-of-line anchors are not equivalent across modes'],
['End of line','$ dollar ending end','$','Not direct','End-of-line anchors are not equivalent across modes'],
['Word start boundary','\\b beginning word','\\b','<','Word start; RE2 \\b matches both word boundaries'],
['Word end boundary','\\b end word','\\b','>','Word end; RE2 \\b matches both word boundaries'],
['Literal period','. dot full stop U+002E','\\.','.','Search for a literal period'],
['Literal asterisk','* star U+002A','\\*','\\*','Search for * itself'],
['Literal plus','+ U+002B','\\+','+','Search for + itself'],
['Literal question mark','? U+003F','\\?','\\?','Search for ? itself'],
['Literal opening parenthesis','( U+0028','\\(','\\(','Search for ( itself'],
['Literal closing parenthesis',') U+0029','\\)','\\)','Search for ) itself'],
['Literal square brackets','[ ] U+005B U+005D','\\[ \\]','\\[ \\]','Search for literal brackets'],
['Literal braces','{ } U+007B U+007D','\\{ \\}','\\{ \\}','Search for literal braces'],
['Literal backslash','\\ U+005C slash','\\\\','\\\\','Search for a backslash'],
['Literal pipe','| U+007C','\\|','|','Search for a vertical bar'],
['Literal dollar','$ U+0024 currency','\\$','$','Search for a dollar sign'],
['Literal caret','^ U+005E','\\^','^','Search for a caret'],
['Case-insensitive flag','ignore case (?i)','(?i)','Match case off','Google RE2 inline flag; Word uses a checkbox'],
['Lookahead','(?=) ahead','Not supported','Not supported','Not supported in RE2 or Word wildcard search'],
['Lookbehind','(?<=) behind','Not supported','Not supported','Not supported in RE2 or Word wildcard search'],
['Match a group in replacement','$1 group replacement capture','$1','\\1','Replacement-field group reference, not a Find pattern']
];
const pythonGuidePatterns = {
  'Any digit': '\\d',
  'One or more digits': '\\d+',
  'Not a digit': '\\D',
  'Any letter': '[A-Za-z]',
  'Any word character': '\\w',
  'Not a word character': '\\W',
  'Any whitespace': '\\s',
  'One or more whitespace': '\\s+',
  'Space': ' ',
  'Tab': '\\t',
  'Non-breaking space': '\\u00A0',
  'Line feed': '\\n',
  'Carriage return / paragraph': '\\r',
  'Any character': '.',
  'Zero or more': 'a*',
  'One or more': 'a+',
  'Optional': 'a?',
  'Exactly N': 'a{3}',
  'At least N': 'a{3,}',
  'Between N and M': 'a{2,5}',
  'Character set': '[abc]',
  'Negated set': '[^abc]',
  'Either / alternation': 'cat|dog',
  'Grouping': '(abc)',
  'Non-capturing group': '(?:abc)',
  'Start of line': '^',
  'End of line': '$',
  'Word start boundary': '\\b',
  'Word end boundary': '\\b',
  'Literal period': '\\.',
  'Literal asterisk': '\\*',
  'Literal plus': '\\+',
  'Literal question mark': '\\?',
  'Literal opening parenthesis': '\\(',
  'Literal closing parenthesis': '\\)',
  'Literal square brackets': '\\[ \\]',
  'Literal braces': '\\{ \\}',
  'Literal backslash': '\\\\',
  'Literal pipe': '\\|',
  'Literal dollar': '\\$',
  'Literal caret': '\\^',
  'Case-insensitive flag': '(?i)',
  'Lookahead': '(?=abc)',
  'Lookbehind': '(?<=abc)',
  'Match a group in replacement': '\\g<1>',
};
const guide = baseGuide.map((row) => [
  row[0],
  row[1],
  row[2],
  row[3],
  pythonGuidePatterns[row[0]] || 'Not supported',
  row[4],
]);
function generate(target){
 return globalThis.SlickSyntaxPattern.generatePattern(
  target,
  $('input-'+target).value,
  {
   digits:$('digits-'+target).checked,
   whitespace:$('space-'+target).checked,
  },
 );
}
function refresh(target) {
  $('out-' + target).value = generate(target);
  $('status-' + target).textContent = '';
}

async function copyText(value) {
  if (!value) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.append(textArea);
    textArea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {}

    textArea.remove();
    return copied;
  }
}

async function copyOutput(target) {
  const copied = await copyText($('out-' + target).value);
  $('status-' + target).textContent = copied
    ? 'Copied to clipboard.'
    : 'Clipboard blocked. Select the result and use Ctrl+C.';
}

function switchPage(page) {
  state.page = page;

  document.querySelectorAll('.view').forEach((view) => {
    view.hidden = view.id !== page;
  });

  document.querySelectorAll('.tab').forEach((button) => {
    button.setAttribute(
      'aria-selected',
      String(button.dataset.page === page),
    );
  });

  if (page === 'guide') {
    $('guide-search').focus();
  } else if (TARGETS.includes(page)) {
    $('input-' + page).focus();
  } else {
    const heading = document.querySelector('#' + page + ' h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  }
}

function renderGuide() {
  const query = $('guide-search').value;
  const target = state.guide;
  const result = globalThis.SlickSyntaxGuideSearch.searchGuide(guide, query);
  const matches = result.matches;
  const displayRows = [...result.characterRows, ...matches];
  const list = $('guide-list');

  list.replaceChildren();

  const header = document.createElement('div');
  header.className = 'guide-row head';
  ['Concept / character', 'Pattern', 'Description', ''].forEach(
    (label, index) => {
      const cell = document.createElement('div');
      cell.className = index === 2 ? 'desc' : '';
      cell.textContent = label;
      header.append(cell);
    },
  );
  list.append(header);

  for (const row of displayRows) {
    const item = document.createElement('div');
    item.className = 'guide-row';

    const name = document.createElement('div');
    name.textContent = row[0];

    const code = document.createElement('code');
    code.textContent = row[{ docs: 2, word: 3, python: 4 }[target]];

    const description = document.createElement('div');
    description.className = 'desc';
    description.textContent = row[5];

    const copyButton = document.createElement('button');
    copyButton.className = 'mini';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy ' + row[0] + ' pattern');
    copyButton.disabled = [
      'Not supported',
      'Not available',
      'Not direct',
      'Match case off',
    ].includes(code.textContent);
    copyButton.addEventListener('click', async () => {
      if (await copyText(code.textContent)) {
        copyButton.textContent = 'Copied';
        setTimeout(() => (copyButton.textContent = 'Copy'), 1100);
      }
    });

    item.append(name, code, description, copyButton);
    list.append(item);
  }

  if (!displayRows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = globalThis.SlickSyntaxGuideSearch.formatNoResults(query);
    list.append(empty);
  }

  $('guide-count').textContent =
    displayRows.length + (displayRows.length === 1 ? ' entry' : ' entries');
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    const page =
      button.dataset.page === 'guide' && state.page === 'guide'
        ? 'docs'
        : button.dataset.page;
    switchPage(page);
  });
});

document.querySelectorAll('[data-legal]').forEach((button) => {
  button.addEventListener('click', () => switchPage(button.dataset.legal));
});

$('copyright-year').textContent = new Date().getFullYear();

const compactLayout = matchMedia('(max-width: 620px)');
const layoutWasChosen = { docs: false, word: false, python: false };

function applyLayout(target, vertical) {
  $('workspace-' + target).classList.toggle('vertical', vertical);
  document
    .querySelectorAll('[data-layout][data-target="' + target + '"]')
    .forEach((layoutButton) => {
      layoutButton.setAttribute(
        'aria-pressed',
        String(layoutButton.dataset.layout === (vertical ? 'vertical' : 'horizontal')),
      );
      layoutButton.disabled = compactLayout.matches && layoutButton.dataset.layout === 'horizontal';
    });
}

function applyResponsiveLayoutDefaults() {
  for (const target of TARGETS) {
    document
      .querySelectorAll('[data-layout="horizontal"][data-target="' + target + '"]')
      .forEach((button) => { button.disabled = compactLayout.matches; });
    if (compactLayout.matches || !layoutWasChosen[target]) applyLayout(target, compactLayout.matches);
  }
}

document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    layoutWasChosen[target] = true;
    applyLayout(target, button.dataset.layout === 'vertical');
  });
});

applyResponsiveLayoutDefaults();
compactLayout.addEventListener('change', applyResponsiveLayoutDefaults);

for (const target of TARGETS) {
  for (const idPrefix of ['input-', 'digits-', 'space-']) {
    $(idPrefix + target).addEventListener('input', () => refresh(target));
  }

  document
    .querySelector('[data-copy="' + target + '"]')
    .addEventListener('click', () => copyOutput(target));

  refresh(target);
}

const tokenCatalog = {
  docs: [
    ['Start of line', ':start:', 'Beginning of a line, ^'],
    ['End of line', ':end:', 'End of a line, $'],
    ['Word boundary', ':boundary:', 'Position at edge of a word, \\b'],
    ['Any character', ':any:', 'Any single character, .'],
    ['Any digits', ':digits:', 'One or more digits, \\d+'],
    ['Line break', ':break:', 'Line feed, \\n'],
  ],
  word: [
    ['Start of word', ':wstart:', 'Beginning of a word, <'],
    ['End of word', ':wend:', 'End of a word, >'],
    [
      'Paragraph mark',
      ':para:',
      'Paragraph mark, ^13; not a start/end-of-line anchor',
    ],
    ['Any character', ':any:', 'Any single character, ?'],
    ['Any digits', ':digits:', 'One or more digits, [0-9]@'],
    ['Manual break', ':break:', 'Manual line break, ^l; not a paragraph mark'],
  ],
  python: [
    ['Start of line', ':start:', 'Beginning of a line, ^'],
    ['End of line', ':end:', 'End of a line, $'],
    ['Word boundary', ':boundary:', 'Position at edge of a word, \\b'],
    ['Any character', ':any:', 'Any single character, .'],
    ['Any digits', ':digits:', 'One or more Unicode digits, \\d+'],
    ['Line break', ':break:', 'Line feed, \\n'],
  ],
};
const tokenDefs = globalThis.SlickSyntaxPattern.tokenDefinitions;
let lastInputSelection={docs:[0,0],word:[0,0],python:[0,0]};
function insertAt(el,text,target){
 const isInput=el.id==='input-'+target;
 const a=isInput?lastInputSelection[target][0]:el.selectionStart;
 const b=isInput?lastInputSelection[target][1]:el.selectionEnd;
 const start=Number.isInteger(a)?a:el.value.length;
 const end=Number.isInteger(b)?b:start;
 el.setRangeText(text,start,end,'end');
 el.dispatchEvent(new Event('input',{bubbles:true}));
 el.focus();
 if(isInput)lastInputSelection[target]=[el.selectionStart,el.selectionEnd];
}
for(const t of TARGETS){
 const input=$('input-'+t),output=$('out-'+t);
 const remember=()=>lastInputSelection[t]=[input.selectionStart,input.selectionEnd];
 ['click','keyup','select','focus','input'].forEach(ev=>input.addEventListener(ev,remember));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      lastInputSelection[t] = [input.selectionStart, input.selectionEnd];
      insertAt(input, '\t', t);
    }
  });
  for (const [label, alias, hint] of tokenCatalog[t]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'token-button';
    button.draggable = true;
    button.title = hint + ' — type ' + alias + ' or drag/click';
    button.setAttribute('aria-label', 'Insert ' + label + ', ' + alias);

    const text = document.createElement('span');
    text.textContent = label;
    const code = document.createElement('code');
    code.textContent = alias;

    button.append(text, code);
    button.addEventListener('click', () => insertAt(input, alias, t));
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', alias);
      event.dataTransfer.setData(
        'application/x-slicksyntax-token',
        alias,
      );
      event.dataTransfer.effectAllowed = 'copy';
    });
    $('tokens-' + t).append(button);
 }
 for(const el of [input,output]){
  el.addEventListener('dragover', (event) => {
    if (
      [...event.dataTransfer.types].includes(
        'application/x-slicksyntax-token',
      )
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      el.classList.add('drop-ready');
    }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop-ready'));
  el.addEventListener('drop', (event) => {
   el.classList.remove('drop-ready');
   const alias = event.dataTransfer.getData('application/x-slicksyntax-token');
   if(!alias||!tokenDefs[alias]?.[t])return;
   event.preventDefault();
   // On output, insert the resulting target syntax, not its typed alias.
   const value=el===output?tokenDefs[alias][t]:alias;
   if(el===input){const p=lastInputSelection[t];el.setSelectionRange(p[0],p[1]);}
   insertAt(el,value,t);
  });
 }
}

document.querySelectorAll('[data-guide]').forEach((button) => {
  button.addEventListener('click', () => {
    state.guide = button.dataset.guide;
    document.querySelectorAll('[data-guide]').forEach((guideButton) => {
      guideButton.setAttribute(
        'aria-pressed',
        String(guideButton === button),
      );
    });
    renderGuide();
  });
});

const guideSearchInput = $('guide-search');
guideSearchInput.addEventListener('input', renderGuide);
guideSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    guideSearchInput.setRangeText(
      '\t',
      guideSearchInput.selectionStart,
      guideSearchInput.selectionEnd,
      'end',
    );
    renderGuide();
  }
});
renderGuide();

const unlockedIcon =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 7.6-1.7"></path></svg>';
const lockedIcon =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>';

function renderPrivateSession(target) {
  const button = document.querySelector('[data-private-session="' + target + '"]');
  const locked = privateSessions[target];
  button.innerHTML = locked ? lockedIcon : unlockedIcon;
  button.setAttribute('aria-pressed', String(locked));
  button.setAttribute(
    'aria-label',
    locked
      ? 'Private session locked. Shift+Enter will not save history'
      : 'Private session unlocked. Shift+Enter saves to history',
  );
  button.title = locked
    ? 'Private session on: Shift+Enter will not save history'
    : 'Private session off: Shift+Enter saves to history';
}

document.querySelectorAll('[data-private-session]').forEach((button) => {
  const target = button.dataset.privateSession;
  renderPrivateSession(target);
  button.addEventListener('click', () => {
    privateSessions[target] = !privateSessions[target];
    renderPrivateSession(target);
    setToolbarStatus(
      target,
      privateSessions[target]
        ? 'Private session locked. Shift+Enter will not add history.'
        : 'Private session unlocked. Shift+Enter will add history.',
    );
  });
});

document.addEventListener('keydown', async (event) => {
 if(
  event.key==='Enter' &&
  event.shiftKey &&
  !event.repeat &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey &&
  TARGETS.includes(state.page)
 ){
  event.preventDefault();
  const target=state.page;
  if(document.activeElement===$('out-'+target)) await copyOutput(target);
  if(privateSessions[target]) {
   setToolbarStatus(target,'Private session locked. Pattern was not added to history.');
  } else {
   saveCurrentPattern(target);
  }
  return;
 }
 if(event.key==='Escape'&&state.page==='guide'&&document.activeElement===$('guide-search')){
  $('guide-search').value='';
  renderGuide();
 }
 if(event.altKey&&!event.ctrlKey&&!event.metaKey&&['1','2','3','4'].includes(event.key)){
  event.preventDefault();
  switchPage({1:'docs',2:'word',3:'python',4:'guide'}[event.key]);
 }
});


const themeToggle = document.getElementById('theme-toggle');
const sunIcon =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.5 1.5m9.8 9.8 1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/><circle cx="12" cy="12" r="4"/></svg>';
const moonIcon =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 14A9 9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z"/></svg>';

function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  themeToggle.innerHTML = dark ? sunIcon : moonIcon;
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute(
    'aria-label',
    dark ? 'Switch to light mode' : 'Switch to dark mode',
  );
  themeToggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  document.querySelector('meta[name="theme-color"]').content = dark
    ? '#0b1220'
    : '#f5f7fa';
}

let savedTheme;
try {
  savedTheme = localStorage.getItem('slicksyntax-theme');
} catch {}

applyTheme(
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
);

themeToggle.addEventListener('click', () => {
  const next =
    document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem('slicksyntax-theme', next);
  } catch {}
});

const HISTORY_KEY = 'slicksyntax-history-v1';
let savedPatterns = readSavedPatterns();
let textExportTarget = 'docs';

function readSavedPatterns() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function persistSavedPatterns(target) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(savedPatterns));
    return true;
  } catch {
    $('toolbar-status-' + target).textContent =
      'Browser storage is unavailable. Download a file to keep this pattern.';
    return false;
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function currentPattern(target) {
  return {
    id: makeId(),
    title: $('title-' + target).value.trim() || 'Untitled pattern',
    target,
    input: $('input-' + target).value,
    output: $('out-' + target).value,
    options: {
      digits: $('digits-' + target).checked,
      whitespace: $('space-' + target).checked,
    },
    savedAt: new Date().toISOString(),
  };
}

function setToolbarStatus(target, message) {
  $('toolbar-status-' + target).textContent = message;
}

function saveCurrentPattern(target) {
  const record = currentPattern(target);
  savedPatterns.unshift(record);
  savedPatterns = savedPatterns.slice(0, 100);
  if (!persistSavedPatterns(target)) {
    savedPatterns.shift();
    return;
  }
  renderHistory();
  setToolbarStatus(target, 'Saved “' + record.title + '” in this browser.');
}

function loadPattern(record) {
  const target = TARGETS.includes(record.target) ? record.target : 'docs';
  switchPage(target);
  $('title-' + target).value = record.title || '';
  $('input-' + target).value = record.input || '';
  $('digits-' + target).checked = record.options?.digits !== false;
  $('space-' + target).checked = record.options?.whitespace !== false;
  refresh(target);
  $('out-' + target).value = record.output || $('out-' + target).value;
  setToolbarStatus(target, 'Loaded “' + (record.title || 'Untitled pattern') + '”.');
}

function renderHistory() {
  for (const target of TARGETS) {
    const records = savedPatterns.filter((record) => record.target === target);
    const list = $('history-list-' + target);
    list.replaceChildren();
    $('history-count-' + target).textContent =
      records.length + (records.length === 1 ? ' item' : ' items');

    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = 'No saved patterns yet.';
      list.append(empty);
      continue;
    }

    for (const record of records) {
      const item = document.createElement('article');
      item.className = 'history-item';

      const summary = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = record.title || 'Untitled pattern';
      const meta = document.createElement('span');
      meta.className = 'history-meta';
      const savedDate = new Date(record.savedAt);
      meta.textContent = Number.isNaN(savedDate.valueOf())
        ? TARGET_LABELS[target]
        : savedDate.toLocaleString();
      const code = document.createElement('code');
      code.textContent = record.output || '(empty output)';
      summary.append(title, meta, code);

      const actions = document.createElement('div');
      actions.className = 'history-actions';
      const loadButton = document.createElement('button');
      loadButton.type = 'button';
      loadButton.textContent = 'Load';
      loadButton.addEventListener('click', () => loadPattern(record));
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', async () => {
        const copied = await copyText(record.output || '');
        setToolbarStatus(target, copied ? 'Saved regex copied.' : 'Clipboard blocked.');
      });
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        if (!confirm('Delete “' + (record.title || 'Untitled pattern') + '” from this browser?')) return;
        savedPatterns = savedPatterns.filter((itemRecord) => itemRecord.id !== record.id);
        persistSavedPatterns(target);
        renderHistory();
        setToolbarStatus(target, 'Saved pattern deleted.');
      });
      actions.append(loadButton, copyButton, deleteButton);
      item.append(summary, actions);
      list.append(item);
    }
  }
}

function safeFilename(value) {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim();
  return (cleaned || 'slicksyntax-pattern').slice(0, 80);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function recordAsText(record) {
  return [
    'Title: ' + record.title,
    'Target: ' + TARGET_LABELS[record.target],
    'Saved: ' + record.savedAt,
    '',
    'Input:',
    record.input,
    '',
    'Output regex:',
    record.output,
  ].join('\n');
}

function downloadText(target, includeHistory) {
  const current = currentPattern(target);
  const records = includeHistory ? [current, ...savedPatterns] : [current];
  const text = records.map(recordAsText).join('\n\n' + '-'.repeat(60) + '\n\n');
  downloadBlob(
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
    safeFilename(current.title) + (includeHistory ? '-with-history' : '') + '.txt',
  );
  setToolbarStatus(target, includeHistory ? 'Current pattern and saved history downloaded.' : 'Current pattern downloaded.');
}

function makeExportPayload(target, includeHistory) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    current: currentPattern(target),
    history: includeHistory ? savedPatterns : [],
  };
}

function downloadJson(target, includeHistory) {
  const payload = makeExportPayload(target, includeHistory);
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    }),
    safeFilename(payload.current.title) +
      (includeHistory ? '-with-browser-history' : '') +
      '.json',
  );
  setToolbarStatus(
    target,
    includeHistory
      ? 'JSON exported with browser history.'
      : 'Current pattern exported as JSON.',
  );
}

async function copyJsonExport(target, includeHistory) {
  const copied = await copyText(
    JSON.stringify(makeExportPayload(target, includeHistory), null, 2),
  );
  setToolbarStatus(
    target,
    copied ? 'JSON export copied to clipboard.' : 'Clipboard access was blocked.',
  );
}

function normalizeImportedRecord(record) {
  if (!record || typeof record !== 'object') return null;
  return {
    id: typeof record.id === 'string' && record.id ? record.id : makeId(),
    title:
      typeof record.title === 'string' && record.title.trim()
        ? record.title.slice(0, 80)
        : 'Untitled pattern',
    target: TARGETS.includes(record.target) ? record.target : 'docs',
    input: typeof record.input === 'string' ? record.input : '',
    output: typeof record.output === 'string' ? record.output : '',
    options: {
      digits: record.options?.digits !== false,
      whitespace: record.options?.whitespace !== false,
    },
    savedAt:
      typeof record.savedAt === 'string' && !Number.isNaN(Date.parse(record.savedAt))
        ? record.savedAt
        : new Date().toISOString(),
  };
}

async function importJsonFile(file) {
  const payload = JSON.parse(await file.text());
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid SlickSyntax export');
  }
  const importedHistory = Array.isArray(payload.history)
    ? payload.history.map(normalizeImportedRecord).filter(Boolean)
    : [];
  const importedCurrent = normalizeImportedRecord(payload.current);
  if (!importedCurrent && !importedHistory.length) {
    throw new Error('No SlickSyntax records found');
  }

  const seen = new Set();
  savedPatterns = [...importedHistory, ...savedPatterns]
    .filter((record) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    })
    .slice(0, 100);
  const target = importedCurrent?.target || textExportTarget;
  if (!persistSavedPatterns(target)) throw new Error('Browser storage unavailable');
  renderHistory();
  if (importedCurrent) loadPattern(importedCurrent);
  setToolbarStatus(
    target,
    'Imported ' + importedHistory.length +
      (importedHistory.length === 1 ? ' saved pattern.' : ' saved patterns.'),
  );
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipDateParts(date) {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const now = zipDateParts(new Date());
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, now.time, true);
    localView.setUint16(12, now.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, now.time, true);
    centralView.setUint16(14, now.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

function offlineRuntime(initialData) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const TARGETS = ['docs', 'word', 'python'];
  const KEY = 'slicksyntax-offline-history-v1';
  let records = [];
  let privateSession = false;
  try {
    const local = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(local)) records = local;
  } catch {}
  if (!records.length && Array.isArray(initialData.history)) records = initialData.history;

  function status(message) { $('status').textContent = message; }
  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
      return true;
    } catch {
      status('Local storage is unavailable. Export JSON to keep your work.');
      return false;
    }
  }
  function id() {
    return globalThis.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function escDocs(character) {
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\u00a0') return '\\x{A0}';
    return /[\\.^$|?*+()[\]{}]/.test(character) ? '\\' + character : character;
  }
  function escWord(character) {
    if (character === '\t') return '^t';
    if (character === '\n') return '^l';
    if (character === '\r') return '^13';
    if (character === '\u00a0') return '^s';
    return /[\\?*()[\]{}@<>]/.test(character) ? '\\' + character : character;
  }
  function escPython(character) {
    if (character === '\0') return '\\x00';
    if (character === '\t') return '\\t';
    if (character === '\n') return '\\n';
    if (character === '\r') return '\\r';
    if (character === '\u00a0') return '\\u00A0';
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) return '\\u' + codePoint.toString(16).toUpperCase().padStart(4, '0');
    if (codePoint < 0x20 || codePoint === 0x7f) return '\\x' + codePoint.toString(16).toUpperCase().padStart(2, '0');
    return /[\\.^$|?*+()[\]{}]/.test(character) ? '\\' + character : character;
  }
  function generate() {
    const target = $('target').value;
    const sample = $('input').value;
    const digits = $('digits').checked;
    const whitespace = $('whitespace').checked;
    const esc = target === 'docs' ? escDocs : target === 'word' ? escWord : escPython;
    const tokens = {
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
    const aliases = Object.keys(tokens).sort((a, b) => b.length - a.length);
    let output = '';
    for (let index = 0; index < sample.length;) {
      if (sample[index] === '{') {
        const close = sample.indexOf('}', index + 1);
        if (close !== -1) {
          output += Array.from(sample.slice(index + 1, close), esc).join('');
          index = close + 1;
          continue;
        }
      }
      const alias = aliases.find((candidate) => sample.startsWith(candidate, index) && tokens[candidate][target]);
      if (alias) {
        output += tokens[alias][target];
        index += alias.length;
        continue;
      }
      const character = String.fromCodePoint(sample.codePointAt(index));
      if (character === '?') {
        output += target === 'word' ? '?' : '.';
        index += character.length;
        continue;
      }
      if (/[a-z]/.test(character)) {
        while (index < sample.length && /[a-z]/.test(sample[index])) index += 1;
        output += target === 'word' ? '[a-z]@' : '[a-z]+';
        continue;
      }
      if (/[A-Z]/.test(character)) {
        while (index < sample.length && /[A-Z]/.test(sample[index])) index += 1;
        output += target === 'word' ? '[A-Z]@' : '[A-Z]+';
        continue;
      }
      if (digits && /[0-9]/.test(character)) {
        while (index < sample.length && /[0-9]/.test(sample[index])) index += 1;
        output += target === 'word' ? '[0-9]@' : '\\d+';
        continue;
      }
      if (whitespace && /[ \t\u00a0]/.test(character)) {
        let part = '';
        while (index < sample.length && /[ \t\u00a0]/.test(sample[index])) part += sample[index++];
        if (target === 'docs') output += '[ \\t\\x{A0}]+';
        else if (target === 'python') output += '[ \\t\\u00A0]+';
        else if (/^ +$/.test(part)) output += ' @';
        else output += Array.from(part, esc).join('');
        continue;
      }
      output += esc(character);
      index += character.length;
    }
    $('output').value = output;
  }
  function current() {
    return {
      id: id(),
      title: $('title').value.trim() || 'Untitled pattern',
      target: $('target').value,
      input: $('input').value,
      output: $('output').value,
      options: { digits: $('digits').checked, whitespace: $('whitespace').checked },
      savedAt: new Date().toISOString(),
    };
  }
  function saveCurrent() {
    const record = current();
    records.unshift(record);
    records = records.slice(0, 100);
    if (saveLocal()) status('Saved “' + record.title + '” locally.');
    render();
  }
  function renderPrivateSession() {
    $('private').textContent = privateSession ? '🔒' : '🔓';
    $('private').setAttribute('aria-pressed', String(privateSession));
    $('private').setAttribute(
      'aria-label',
      privateSession
        ? 'Private session locked. Shift+Enter will not save history'
        : 'Private session unlocked. Shift+Enter saves to history',
    );
    $('private').title = privateSession
      ? 'Private session on: Shift+Enter will not save history'
      : 'Private session off: Shift+Enter saves to history';
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      $('output').focus();
      $('output').select();
      try { return document.execCommand('copy'); } catch { return false; }
    }
  }
  function load(record) {
    $('title').value = record.title || '';
    $('target').value = TARGETS.includes(record.target) ? record.target : 'docs';
    $('input').value = record.input || '';
    $('digits').checked = record.options?.digits !== false;
    $('whitespace').checked = record.options?.whitespace !== false;
    generate();
    $('output').value = record.output || $('output').value;
    status('Loaded “' + (record.title || 'Untitled pattern') + '”.');
  }
  function render() {
    const list = $('history');
    list.replaceChildren();
    $('count').textContent = records.length + (records.length === 1 ? ' item' : ' items');
    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No local history yet.';
      list.append(empty);
      return;
    }
    records.forEach((record) => {
      const item = document.createElement('article');
      const info = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = record.title || 'Untitled pattern';
      const code = document.createElement('code');
      code.textContent = record.output || '(empty output)';
      info.append(name, code);
      const actions = document.createElement('div');
      ['Load', 'Copy', 'Delete'].forEach((label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        if (label === 'Load') button.addEventListener('click', () => load(record));
        if (label === 'Copy') button.addEventListener('click', async () => status(await copy(record.output || '') ? 'Copied.' : 'Clipboard blocked.'));
        if (label === 'Delete') button.addEventListener('click', () => {
          if (!confirm('Delete “' + (record.title || 'Untitled pattern') + '”?')) return;
          records = records.filter((entry) => entry.id !== record.id);
          saveLocal();
          render();
        });
        actions.append(button);
      });
      item.append(info, actions);
      list.append(item);
    });
  }
  function download(data, filename, type) {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  ['input', 'target', 'digits', 'whitespace'].forEach((name) => $(name).addEventListener('input', generate));
  $('input').addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      $('input').setRangeText('\t', $('input').selectionStart, $('input').selectionEnd, 'end');
      generate();
    }
  });
  document.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter' || !event.shiftKey || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if (document.activeElement === $('output')) await copy($('output').value);
    if (privateSession) status('Private session locked. Pattern was not added to history.');
    else saveCurrent();
  });
  $('private').addEventListener('click', () => {
    privateSession = !privateSession;
    renderPrivateSession();
    status(privateSession ? 'Private session locked.' : 'Private session unlocked.');
  });
  $('copy').addEventListener('click', async () => status(await copy($('output').value) ? 'Regex copied.' : 'Clipboard blocked.'));
  $('paste').addEventListener('click', async () => {
    try {
      $('input').value = await navigator.clipboard.readText();
      generate();
      status('Clipboard pasted into input.');
    } catch {
      $('input').focus();
      status('Clipboard access was blocked. Press Ctrl+V in the input box.');
    }
  });
  $('save').addEventListener('click', saveCurrent);
  $('export-json').addEventListener('click', () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), current: current(), history: records };
    download(JSON.stringify(payload, null, 2), 'slicksyntax-data.json', 'application/json');
    status('JSON backup downloaded.');
  });
  $('export-text').addEventListener('click', () => {
    const record = current();
    download('Title: ' + record.title + '\nTarget: ' + record.target + '\n\nInput:\n' + record.input + '\n\nOutput regex:\n' + record.output, 'slicksyntax-pattern.txt', 'text/plain');
  });
  $('import-json').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!Array.isArray(payload.history)) throw new Error('Invalid history');
      records = payload.history;
      saveLocal();
      if (payload.current) load(payload.current);
      render();
      status('JSON data imported.');
    } catch {
      status('That file is not a valid SlickSyntax JSON export.');
    }
    event.target.value = '';
  });
  if (initialData.current) load(initialData.current);
  renderPrivateSession();
  saveLocal();
  render();
}

function createOfflineHtml(snapshot) {
  const data = JSON.stringify(snapshot).replace(/</g, '\\u003c');
  const runtime = offlineRuntime.toString().replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SlickSyntax Offline</title><style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#0b1220;color:#f6f9ff}*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#f6f9ff}header{border-bottom:1px solid #667e9a;background:#131e30}.bar,main{max-width:1050px;margin:auto;padding:18px 22px}.brand{font-size:21px;font-weight:800}.brand small{font-size:12px;font-weight:500;color:#d4dfea;margin-left:8px}main{padding-top:30px}.intro,.muted,.empty{color:#d4dfea}.toolbar{display:grid;grid-template-columns:2fr 1fr auto;gap:12px;margin:20px 0 12px}.editor{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel,.history{background:#131e30;border:1px solid #667e9a;border-radius:14px;padding:18px}.field{display:grid;gap:6px;font-size:13px;font-weight:700}input,select,textarea,button{font:inherit}input,select,textarea{width:100%;border:1px solid #9eafc4;border-radius:9px;background:#0b1220;color:#f6f9ff;padding:11px}textarea{height:280px;resize:vertical;font:14px/1.55 ui-monospace,Consolas,monospace}.options,.actions,.history-head,.history article{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.options{margin-top:12px}.options label{display:flex;gap:7px;align-items:center}.options input{width:auto}.actions{justify-content:flex-end}.actions button,.file-button,.history button{border:1px solid #9eafc4;border-radius:8px;background:#1e2d43;color:#f6f9ff;padding:9px 12px;cursor:pointer}.primary{background:#bdd5ff!important;color:#101b2c!important;font-weight:750}.status{min-height:20px;color:#d4dfea}.history{margin-top:16px}.history-head{justify-content:space-between}.history-head h2{font-size:17px;margin:0}.history-list{display:grid;gap:8px;margin-top:12px}.history article{justify-content:space-between;background:#1e2d43;border-radius:9px;padding:10px}.history article>div:first-child{min-width:0;flex:1}.history strong,.history code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history code{margin-top:5px;color:#d4dfea}.warning{margin-top:16px;border:1px solid #ffd76e;border-radius:10px;padding:12px;color:#fff2bd}.file-button input{position:absolute;opacity:0;pointer-events:none}@media(max-width:720px){.toolbar,.editor{grid-template-columns:1fr}.actions{justify-content:flex-start}textarea{height:220px}}
</style></head><body><header><div class="bar"><div class="brand">SlickSyntax <small>Offline regex helper</small></div></div></header>
<main><h1>Regex Builder</h1><p class="intro">Build, copy, and save Google Docs, Microsoft Word, or Python re search patterns entirely on this device.</p>
<div class="toolbar"><label class="field">Title<input id="title" maxlength="80" placeholder="Untitled pattern"></label><label class="field">Target<select id="target"><option value="docs">Google Docs</option><option value="word">Microsoft Word</option><option value="python">Python re</option></select></label><div class="actions"><button id="private" aria-pressed="false" title="Private session off"></button><button id="save" class="primary">Save locally</button><button id="export-text">Download text</button><button id="export-json">Export JSON</button><label class="file-button">Import JSON<input id="import-json" type="file" accept="application/json"></label></div></div>
<div class="editor"><section class="panel"><h2>Input</h2><textarea id="input" placeholder="Type or paste sample text…"></textarea><div class="options"><label><input id="digits" type="checkbox" checked> Any number</label><label><input id="whitespace" type="checkbox" checked> Whitespace runs</label><button id="paste">Paste</button></div><p class="muted">? means any one character. Use {?} for a literal question mark.</p></section><section class="panel"><h2>Output regex</h2><textarea id="output" placeholder="Generated pattern appears here…"></textarea><div class="actions"><button id="copy" class="primary">Copy output</button></div></section></div>
<p id="status" class="status" role="status" aria-live="polite"></p><section class="history"><div class="history-head"><h2>Local history</h2><span id="count">0 items</span></div><div id="history" class="history-list"></div></section>
<p class="warning"><strong>Keep slicksyntax-data.json safe.</strong> It is the portable backup of your saved patterns. If you delete it and clear this browser’s local data, the saved history cannot be recovered.</p></main>
<script>(${runtime})(${data});<\/script></body></html>`;
}

function downloadOfflinePackage(target) {
  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    current: currentPattern(target),
    history: savedPatterns,
  };
  const json = JSON.stringify(snapshot, null, 2);
  const readme = [
    'SlickSyntax Offline',
    '===================',
    '',
    'Open slicksyntax-offline.html in a modern browser. It runs without a server or internet connection.',
    '',
    'Keep slicksyntax-data.json safe. It is the portable backup of your saved patterns.',
    'If you delete the JSON file and clear the browser data used by the offline HTML file, your saved history cannot be recovered.',
    '',
    'Use Import JSON in the offline app to restore or move the saved data.',
  ].join('\n');
  const zip = createZip([
    { name: 'slicksyntax-offline.html', data: createOfflineHtml(snapshot) },
    { name: 'slicksyntax-data.json', data: json },
    { name: 'README.txt', data: readme },
  ]);
  downloadBlob(zip, 'slicksyntax-offline.zip');
  setToolbarStatus(target, 'Offline ZIP downloaded with HTML, JSON, and recovery instructions.');
}

document.querySelectorAll('[data-save]').forEach((button) => {
  button.addEventListener('click', () => saveCurrentPattern(button.dataset.save));
});

document.querySelectorAll('[data-open-export]').forEach((button) => {
  button.addEventListener('click', () => {
    textExportTarget = button.dataset.openExport;
    $('include-browser-history').checked = false;
    if ($('export-dialog').showModal) $('export-dialog').showModal();
    else downloadJson(textExportTarget, false);
  });
});

document.querySelectorAll('[data-export-offline]').forEach((button) => {
  button.addEventListener('click', () => downloadOfflinePackage(button.dataset.exportOffline));
});

document.querySelectorAll('[data-export-format]').forEach((button) => {
  button.addEventListener('click', async () => {
    const includeHistory = $('include-browser-history').checked;
    if (button.dataset.exportFormat === 'json') {
      downloadJson(textExportTarget, includeHistory);
    } else if (button.dataset.exportFormat === 'txt') {
      downloadText(textExportTarget, includeHistory);
    } else {
      await copyJsonExport(textExportTarget, includeHistory);
    }
    $('export-dialog').close();
  });
});

$('import-json').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    await importJsonFile(file);
    $('export-dialog').close();
  } catch {
    setToolbarStatus(
      textExportTarget,
      'That file is not a valid SlickSyntax JSON export.',
    );
  }
  event.target.value = '';
});

function arrangeEditorShells() {
for (const target of TARGETS) {
    const workspace = $('workspace-' + target);
    const tokenTray = $('tokens-' + target).closest('.token-tray');
    const historyPanel = $('history-list-' + target).closest('.history-panel');
    const shell = document.createElement('div');
    shell.className = 'editor-shell history-collapsed';

    const sidebar = document.createElement('aside');
    sidebar.className = 'history-sidebar';
    sidebar.setAttribute('aria-label', 'Local regex history');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'history-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Expand local history');
    toggle.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16"></path><path class="drawer-arrow" d="m8 9-3 3 3 3"></path></svg><span>History</span>';
    toggle.addEventListener('click', () => {
      const collapsed = shell.classList.toggle('history-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute(
        'aria-label',
        collapsed ? 'Expand local history' : 'Collapse local history',
      );
    });

    const main = document.createElement('div');
    main.className = 'editor-main';
    workspace.before(shell);
    sidebar.append(toggle, historyPanel);
    main.append(workspace, tokenTray);
    shell.append(sidebar, main);
  }
}

arrangeEditorShells();
renderHistory();

