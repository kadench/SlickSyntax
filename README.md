# SlickSyntax

[![AI USED](https://img.shields.io/badge/AI%20USED-%E2%9C%A8-blue)](https://openai.com/)

**SlickSyntax** is a lightweight, browser-based pattern builder for **Google Docs** and **Microsoft Word**. Paste sample text, generate a target-specific Find pattern, refine the result, and copy it. No account, installation, build step, or backend is required.

The app is a small static site made up of [`index.html`](./index.html), [`styles.css`](./styles.css), and [`script.js`](./script.js), so it can run locally or be hosted on GitHub Pages.

## Features

- **Google Docs** patterns based on its RE2-style regular-expression syntax.
- **Microsoft Word** patterns using Word's distinct *Use wildcards* syntax.
- Live generation from sample text, with optional generalization of numbers and whitespace.
- Exact-match segments wrapped in single braces, for example `{Invoice}`.
- Compact draggable and clickable pattern tokens, with typed aliases such as `:start:` and `:digits:`.
- Two equally sized, editable input/output panels, arranged side by side or stacked.
- Searchable syntax guide, including character-based searches such as `3`, `[` or `U+00A0`.
- Accessible light/dark themes, keyboard navigation, and a reduced-motion-aware interface.
- In-app Privacy Policy and Terms of Service.

## Quick start

1. Open `index.html` in a modern browser, or visit your deployed GitHub Pages site.
2. Select **Google Docs** or **Microsoft Word** above the editors.
3. Type or paste example text in **Input**. **Output** updates automatically.
4. Edit the output if necessary, then use **Shift+Enter** while focused in the output or click **Copy output**.
5. Paste the copied pattern into your target application's Find field.

In Google Docs, open **Find and replace** (`Ctrl+H`) and enable **Match using regular expressions**. In desktop Microsoft Word, open **Advanced Find**, select **More**, and enable **Use wildcards**.

### Input syntax

SlickSyntax interprets input as *sample text to generalize*, **not** as an already-written regular expression. It generally converts lowercase letter runs to `[a-z]+` (Google Docs) or `[a-z]@` (Word), uppercase runs similarly, and numeric runs to digit patterns when **Any number** is enabled.

| Input | Google Docs output | Word output |
| --- | --- | --- |
| `aaaaz` | `[a-z]+` | `[a-z]@` |
| `{aaaaz}` | `aaaaz` | `aaaaz` |
| `Hi42` | `[A-Z]+[a-z]+\d+` | `[A-Z]@[a-z]@[0-9]@` |
| `{A+B}` | `A\+B` | `A+B` |

**Exact text:** Put literal segments in `{...}`. These braces are SlickSyntax input instructions, not part of the output pattern. An unclosed opening brace is treated as ordinary input. To match literal braces themselves, review and, if needed, edit the generated output.

**Options:** Uncheck **Any number** to leave digits literal. Uncheck **Whitespace runs** to preserve individual whitespace characters rather than generalize them. The two targets may handle whitespace differently; notably, Word wildcard searching does not offer an exact equivalent of every RE2 feature.

### Insertable tokens

Use the **Insert patterns** tray underneath both editor panels. Click a token to insert its alias at the input cursor, drag it into an editor, or type its alias directly.

| Alias | Google Docs | Microsoft Word |
| --- | --- | --- |
| `:start:` | `^` | Not available |
| `:end:` | `$` | Not available |
| `:boundary:` | `\b` | Not available |
| `:wstart:` | Not available | `<` |
| `:wend:` | Not available | `>` |
| `:any:` | `.` | `?` |
| `:digits:` | `\d+` | `[0-9]@` |
| `:break:` | `\n` | `^l` |
| `:para:` | Not available | `^13` |

Tokens dragged into the **input** use SlickSyntax aliases; tokens dragged into the **output** insert the target's actual search syntax. Word's paragraph marker is not a direct equivalent of the Google Docs start/end-of-line anchors.

## Keyboard and layout

| Action | Shortcut |
| --- | --- |
| Insert a newline in the input | `Enter` |
| Paste into the input | `Ctrl+V` (or platform equivalent) |
| Copy output while the output editor is focused | `Shift+Enter` |
| Copy selected text normally | `Ctrl+C` (or platform equivalent) |
| Go to Google Docs / Word / guide | `Alt+1` / `Alt+2` / `Alt+3` |
| Clear the guide search when it is focused | `Escape` |

Use the icon controls labeled **Place input and output side by side** and **Stack input above output** to change the editor orientation. The output is editable; changing the input or generator settings regenerates it, so copy any manual modifications before changing the input.

## Deploy on GitHub Pages

1. Create a GitHub repository (or open an existing one).
2. Add `index.html` and this `README.md` to its root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose the branch containing `index.html` and the **/(root)** folder, then save.
5. Use the Pages URL GitHub provides after deployment.

No package manager, build command, API key, external database, or server-side process is required. You can also simply double-click `index.html` to use it locally.

## Privacy and data

SlickSyntax processes editor text locally in the browser. The shipped app has no backend, login, analytics, or intentional transmission of input or generated patterns. It uses browser `localStorage` **only to remember the theme** (`slicksyntax-theme`); it does not persist editor content there. Static hosting providers, including GitHub Pages, may still log requests, and opening external documentation links is subject to those sites' policies. See the **Privacy Policy** in the app.

## Compatibility and limitations

- Google Docs and Word have **different Find syntaxes**. Not every expression can be translated between them.
- The generated pattern is a starting point, not a guarantee that it will match precisely what you intend. In particular, generalizing letter runs can match much more than the original sample.
- Word wildcard features and special-character codes can vary by context and application version. Test consequential find-and-replace operations in the target application before replacing text broadly.
- The syntax guide is a practical reference, **not** an exhaustive grammar specification.
- Accessibility features target good keyboard usability and high text contrast, but this README does not claim independent WCAG AAA certification.

Reference material: [Google Docs Find and replace](https://support.google.com/docs/answer/62754), [RE2 syntax](https://github.com/google/re2/wiki/syntax), and [Microsoft Word Find and replace](https://support.microsoft.com/en-us/office/find-and-replace-text-c6728c16-469e-43cd-afe4-7708c6c779b7).

## Terms

Provided **as is**, without warranties, to the extent allowed by law. Features, availability, and terms may change. The in-app **Terms of Service** contains additional notices; neither this README nor those notices are legal advice.



