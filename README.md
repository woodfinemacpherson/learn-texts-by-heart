# Learn by Heart

A small web app for committing poems and important passages to memory.
Paste any text (or pick one from the built-in Treasury or a random poem from
[PoetryDB](https://poetrydb.org)) and work through four kinds of practice:

| Mode | What you do |
| --- | --- |
| **Cloze** | Words are hidden at random; type each one back. A wrong guess shows the first letters, a second shows the word, a third fills it in. Choose how much of the text to hide (10–100%). |
| **Initials** | The text is shown as first letters only (or hidden entirely). Recite aloud and tap any word you can't recall to reveal it. |
| **Flash** | Each line is shown briefly, then fades. Type it from memory. Mistakes are pointed out word by word, and at the end you can drill only the lines you found hard. |
| **Flow** | Write out the whole passage unaided. You're told as soon as you go wrong and can ask for a hint or undo the mistake. |

Matching ignores case, punctuation, accents and curly-vs-straight apostrophes,
so only the words count. Your text and settings are saved in the browser's
local storage, and the app has day and night themes.

## Development

Requires Node 20+.

```bash
npm install
npm run dev       # start the dev server on http://localhost:5173
npm test          # run the unit and component tests (Vitest)
npm run lint      # ESLint
npm run build     # production build into ./build
```

Built with React, Vite and Tailwind CSS v4. Fonts (Cinzel, Cinzel Decorative
and EB Garamond) are bundled via Fontsource, so the app makes no font requests
to third parties.
