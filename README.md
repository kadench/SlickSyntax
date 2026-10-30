# SlickSyntax

[GitHub home](https://github.com/kadench/SlickSyntax) · [Download for local use](https://github.com/kadench/SlickSyntax/archive/refs/heads/main.zip)

[![AI USED](https://img.shields.io/badge/AI%20USED-%E2%9C%A8-lightgrey?labelColor=blue)](https://openai.com/)

**SlickSyntax** is a lightweight, browser-based pattern builder for **Google Docs**, **Microsoft Word**, and Python's **`re` module**. Paste sample text, generate a target-specific pattern, refine the result, and copy it. No account, installation, build step, or backend is required.

The app is a small static site made up of [`index.html`](./index.html), [`styles.css`](./styles.css), [`script.js`](./script.js), and testable search/generator modules, so it can run locally or be hosted on GitHub Pages.

## Features

- **Google Docs** patterns based on its RE2-style regular-expression syntax.
- **Microsoft Word** patterns using Word's distinct *Use wildcards* syntax.
- **Python `re`** patterns with safe literal escaping for punctuation, controls, whitespace, and Unicode input.
- Live generation from sample text, with optional generalization of numbers and whitespace.
- Exact-match segments wrapped in single braces, for example `{Invoice}`.
- Compact draggable and clickable pattern tokens, with typed aliases such as `:start:` and `:digits:`.
- Two equally sized, editable input/output panels, arranged side by side or stacked.
- A collapsed-by-default right-edge history drawer with browser-local titles, saved regex, load, copy, and delete controls.
- Current-only or current-plus-history text downloads.
- A downloadable offline ZIP containing a standalone HTML app, portable JSON data, and recovery instructions.
- Searchable syntax guide that accepts literal characters, decimal code points such as `33`, Unicode forms such as `U+00A0`, names, patterns, actual Tab input, and pasted character lists.
- Accessible light/dark themes, keyboard navigation, and a reduced-motion-aware interface.
- In-app Privacy Policy and Terms of Service.

## Quick start

1. Open `index.html` in a modern browser, or visit your deployed GitHub Pages site.
2. Select **Google Docs**, **Microsoft Word**, or **Python re** above the editors.
3. Type or paste example text in **Input**. **Output** updates automatically.
4. Edit the output if necessary. Use **Shift+Enter** to add the current pattern to local history; while the output is focused it also copies the output. Lock the private-session padlock beside the title to prevent Shift+Enter from saving.
5. Optionally give the pattern a title and use the save icon to keep it in this browser.
6. Paste the copied pattern into your target application's Find field.

In Google Docs, open **Find and replace** (`Ctrl+H`) and enable **Match using regular expressions**. In desktop Microsoft Word, open **Advanced Find**, select **More**, and enable **Use wildcards**. In Python, pass the copied pattern to `re.search`, `re.fullmatch`, `re.sub`, or another `re` function; raw strings are recommended when placing a pattern directly in source code.

### Input syntax

SlickSyntax interprets input as *sample text to generalize*, **not** as an already-written regular expression. It generally converts lowercase letter runs to `[a-z]+` (Google Docs and Python) or `[a-z]@` (Word), uppercase runs similarly, and numeric runs to digit patterns when **Any number** is enabled.

| Input | Google Docs output | Word output | Python `re` output |
| --- | --- | --- | --- |
| `aaaaz` | `[a-z]+` | `[a-z]@` | `[a-z]+` |
| `{aaaaz}` | `aaaaz` | `aaaaz` | `aaaaz` |
| `Hi42` | `[A-Z]+[a-z]+\d+` | `[A-Z]@[a-z]@[0-9]@` | `[A-Z]+[a-z]+\d+` |
| `{A+B}` | `A\+B` | `A+B` | `A\+B` |

**Exact text:** Put literal segments in `{...}`. These braces are SlickSyntax input instructions, not part of the output pattern. An unclosed opening brace is treated as ordinary input. To match literal braces themselves, review and, if needed, edit the generated output.

An unwrapped `?` means any one character (`.` for Google Docs and Python or `?` for Microsoft Word). Wrap it as `{?}` when you mean a literal question mark; the output then escapes it as `\?`.

**Options:** Uncheck **Any number** to leave digits literal. Uncheck **Whitespace runs** to preserve individual whitespace characters rather than generalize them. The two targets may handle whitespace differently; notably, Word wildcard searching does not offer an exact equivalent of every RE2 feature.

### Insertable tokens

Use the **Insert patterns** tray underneath both editor panels. Click a token to insert its alias at the input cursor, drag it into an editor, or type its alias directly.

| Alias | Google Docs | Microsoft Word | Python `re` |
| --- | --- | --- | --- |
| `:start:` | `^` | Not available | `^` |
| `:end:` | `$` | Not available | `$` |
| `:boundary:` | `\b` | Not available | `\b` |
| `:wstart:` | Not available | `<` | Not available |
| `:wend:` | Not available | `>` | Not available |
| `:any:` | `.` | `?` | `.` |
| `:digits:` | `\d+` | `[0-9]@` | `\d+` |
| `:break:` | `\n` | `^l` | `\n` |
| `:para:` | Not available | `^13` | Not available |

Tokens dragged into the **input** use SlickSyntax aliases; tokens dragged into the **output** insert the target's actual search syntax. Word's paragraph marker is not a direct equivalent of the Google Docs start/end-of-line anchors.

## Keyboard and layout

| Action | Shortcut |
| --- | --- |
| Insert a newline in the input | `Enter` |
| Insert a tab in the input | `Tab` |
| Move focus backward from the input | `Shift+Tab` |
| Paste into the input | `Ctrl+V` (or platform equivalent) |
| Add the current pattern to local history | `Shift+Enter` |
| Copy output and add it to history while the output editor is focused | `Shift+Enter` |
| Copy selected text normally | `Ctrl+C` (or platform equivalent) |
| Go to Google Docs / Word / Python / guide | `Alt+1` / `Alt+2` / `Alt+3` / `Alt+4` |
| Insert a literal Tab in guide search | `Tab` |
| Move backward from guide search | `Shift+Tab` |
| Clear the guide search when it is focused | `Escape` |

The default follows viewport width: input and output sit side by side above 620 px, while narrower screens stack them and disable the side-by-side control. On wider screens, use the layout icons to choose either orientation. The output is editable; changing the input or generator settings regenerates it, so copy any manual modifications before changing the input.

## Save and export

The labeled **Save To Browser**, **Export To**, and **Use Site Offline** actions appear above each editor. **Save To Browser** stores the current title, input, generated output, and options locally in this browser. Shift+Enter also saves automatically unless the padlock beside the title is locked for a private session; explicit **Save To Browser** clicks still save. **Export To** opens a dialog for downloading JSON or text, copying structured JSON to the clipboard, or importing a previous JSON export. Its browser-history switch is off each time the dialog opens, so saved browser history is excluded unless you deliberately include it. Use the collapsed **History** control on the far-right edge to reveal saved regex. **Use Site Offline** creates a ZIP containing `slicksyntax-offline.html`, `slicksyntax-data.json`, and a short `README.txt`.

Open `slicksyntax-offline.html` directly in a modern browser. The standalone app supports local history, load, copy, paste, text download, JSON import, and JSON export without a server or internet connection.

**Keep `slicksyntax-data.json` safe.** It is the portable backup of the exported patterns. If you delete the JSON file and later clear the browser data used by the online or offline app, that saved history cannot be recovered.

## Deploy on GitHub Pages

1. Create a GitHub repository (or open an existing one).
2. Add `index.html` and this `README.md` to its root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose the branch containing `index.html` and the **/(root)** folder, then save.
5. Use the Pages URL GitHub provides after deployment.

No package manager, build command, API key, external database, or server-side process is required. You can also simply double-click `index.html` to use it locally.

## Tests

The pattern generator and syntax-guide search are pure JavaScript modules with Node test coverage for literal and wildcard punctuation, exact braces, aliases, whitespace, control characters, Unicode code points, decimal character lookup, pasted lists, Tab searches, invalid values, and no-result text.

Run all tests with `node --test tests/*.test.js`.

## Privacy and data

SlickSyntax processes editor text locally in the browser. The shipped app has no backend, login, analytics, or intentional transmission of input or generated patterns. Browser `localStorage` remembers the theme (`slicksyntax-theme`) and stores pattern history only when **Save To Browser** is used (`slicksyntax-history-v1`). Clearing site data removes that local history. Static hosting providers, including GitHub Pages, may still log requests, and opening external documentation links is subject to those sites' policies. See the **Privacy Policy** in the app.

## Compatibility and limitations

- Google Docs, Word, and Python `re` have **different pattern syntaxes and behavior**. Not every expression can be translated between them.
- The generated pattern is a starting point, not a guarantee that it will match precisely what you intend. In particular, generalizing letter runs can match much more than the original sample.
- Word wildcard features and special-character codes can vary by context and application version. Test consequential find-and-replace operations in the target application before replacing text broadly.
- The syntax guide is a practical reference, **not** an exhaustive grammar specification.
- Accessibility features target good keyboard usability and high text contrast, but this README does not claim independent WCAG AAA certification.

Reference material: [Google Docs Find and replace](https://support.google.com/docs/answer/62754), [RE2 syntax](https://github.com/google/re2/wiki/syntax), [Microsoft Word Find and replace](https://support.microsoft.com/en-us/office/find-and-replace-text-c6728c16-469e-43cd-afe4-7708c6c779b7), and [Python `re`](https://docs.python.org/3/library/re.html).

## Terms

Provided **as is**, without warranties, to the extent allowed by law. Features, availability, and terms may change. The in-app **Terms of Service** contains additional notices.



