'use strict';
const $ = (id) => document.getElementById(id);
const state = { docs: {}, word: {}, guide: 'docs', page: 'docs' };
const guide = [
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
function escDocs(character) {
  if (character === '\t') return '\\t';
  if (character === '\n') return '\\n';
  if (character === '\r') return '\\r';
  if (character === '\u00a0') return '\\x{A0}';
  return /[\\.^$|?*+()[\]{}]/.test(character)
    ? '\\' + character
    : character;
}

function escWord(character) {
  if (character === '\t') return '^t';
  if (character === '\n') return '^l';
  if (character === '\r') return '^13';
  if (character === '\u00a0') return '^s';
  return /[\\?*()[\]{}@<>]/.test(character)
    ? '\\' + character
    : character;
}
function generate(target){
 const sample=$('input-'+target).value;
 const digits=$('digits-'+target).checked;
 const space=$('space-'+target).checked;
 const esc=target==='docs'?escDocs:escWord;
 let out='';
 for(let i=0;i<sample.length;){
  // {...} is the deliberately simple SlickSyntax escape hatch for exact text.
  // An unclosed marker is treated as normal text, never discarded.
  if(sample[i]==='{'){
   const close=sample.indexOf('}',i+1);
   if(close!==-1){out+=Array.from(sample.slice(i+1,close),esc).join('');i=close+1;continue;}
  }
  // Named tokens are processed before ordinary letters. Exact braces take priority.
  const alias=Object.keys(tokenDefs).find(k=>sample.startsWith(k,i)&&tokenDefs[k][target]);
  if(alias){out+=tokenDefs[alias][target];i+=alias.length;continue;}
  const c=sample[i];
  if(/[a-z]/.test(c)){
   while(i<sample.length&&/[a-z]/.test(sample[i]))i++;
   out+=target==='docs'?'[a-z]+':'[a-z]@';continue;
  }
  if(/[A-Z]/.test(c)){
   while(i<sample.length&&/[A-Z]/.test(sample[i]))i++;
   out+=target==='docs'?'[A-Z]+':'[A-Z]@';continue;
  }
  if(digits&&/[0-9]/.test(c)){
   while(i<sample.length&&/[0-9]/.test(sample[i]))i++;
   out+=target==='docs'?'\\d+':'[0-9]@';continue;
  }
  if(space&&/[ \t\u00a0]/.test(c)){
   let part='';while(i<sample.length&&/[ \t\u00a0]/.test(sample[i]))part+=sample[i++];
   if(target==='docs')out+='[ \\t\\x{A0}]+';
   else if(/^ +$/.test(part))out+=' @';
   else out+=Array.from(part,esc).join('');
   continue;
  }
  out+=esc(c);i++;
 }
 return out;
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
  } else if (page === 'docs' || page === 'word') {
    $('input-' + page).focus();
  } else {
    const heading = document.querySelector('#' + page + ' h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  }
}

function renderGuide() {
  const query = $('guide-search').value.toLowerCase();
  const target = state.guide;
  const matches = guide.filter((row) =>
    row.join(' ').toLowerCase().includes(query),
  );
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

  for (const row of matches) {
    const item = document.createElement('div');
    item.className = 'guide-row';

    const name = document.createElement('div');
    name.textContent = row[0];

    const code = document.createElement('code');
    code.textContent = row[target === 'docs' ? 2 : 3];

    const description = document.createElement('div');
    description.className = 'desc';
    description.textContent = row[4];

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

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent =
      'No matching syntax. Try the character itself, a code point (U+00A0), or a description.';
    list.append(empty);
  }

  $('guide-count').textContent = matches.length + ' entries';
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

document.querySelectorAll('[data-layout]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    const vertical = button.dataset.layout === 'vertical';

    $('workspace-' + target).classList.toggle('vertical', vertical);
    document
      .querySelectorAll('[data-layout][data-target="' + target + '"]')
      .forEach((layoutButton) => {
        layoutButton.setAttribute(
          'aria-pressed',
          String(layoutButton === button),
        );
      });
  });
});

for (const target of ['docs', 'word']) {
  for (const idPrefix of ['input-', 'digits-', 'space-']) {
    $(idPrefix + target).addEventListener('input', () => refresh(target));
  }

  document
    .querySelector('[data-copy="' + target + '"]')
    .addEventListener('click', () => copyOutput(target));

  refresh(target);
}

// Aliases are SlickSyntax source instructions, not raw RE2 / Word expressions.
// Word does not offer an equivalent of the ^ and $ line anchors, so only
// paragraph markers are offered in its tray.
const tokenDefs = {
  ':start:': { docs: '^' },
  ':end:': { docs: '$' },
  ':boundary:': { docs: '\\b' },
  ':any:': { docs: '.', word: '?' },
  ':digits:': { docs: '\\d+', word: '[0-9]@' },
  ':wstart:': { word: '<' },
  ':wend:': { word: '>' },
  ':para:': { word: '^13' },
  ':break:': { docs: '\\n', word: '^l' },
};
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
};
let lastInputSelection={docs:[0,0],word:[0,0]};
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
for(const t of ['docs','word']){
 const input=$('input-'+t),output=$('out-'+t);
 const remember=()=>lastInputSelection[t]=[input.selectionStart,input.selectionEnd];
 ['click','keyup','select','focus','input'].forEach(ev=>input.addEventListener(ev,remember));
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

$('guide-search').addEventListener('input', renderGuide);
renderGuide();

document.addEventListener('keydown', (event) => {
 if(
  event.key==='Enter' &&
  event.shiftKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey &&
  ['docs','word'].includes(state.page) &&
  document.activeElement===$('out-'+state.page)
 ){
  event.preventDefault();copyOutput(state.page);return;
 }
 if(event.key==='Escape'&&state.page==='guide'&&document.activeElement===$('guide-search')){
  $('guide-search').value='';
  renderGuide();
 }
 if(event.altKey&&!event.ctrlKey&&!event.metaKey&&['1','2','3'].includes(event.key)){
  event.preventDefault();
  switchPage({1:'docs',2:'word',3:'guide'}[event.key]);
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

