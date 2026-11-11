// Core text utilities shared by every practice mode.
//
// A passage is parsed into lines, and each line into tokens. A token is either
// a "word" (letters/digits, allowing inner apostrophes and hyphens such as
// "o'er" or "well-known") or "gap" text (spaces and punctuation). Keeping the
// punctuation separate means learners are only ever asked for the word itself,
// never for the comma that happens to follow it.

// "&" counts as a word (typed as "&" or "and").
const WORD_RE = /&|[\p{L}\p{M}\p{N}]+(?:['’ʼ‘-][\p{L}\p{M}\p{N}]+)*/gu;

/** Normalise line endings, tabs and non-breaking spaces; trim trailing space. */
export function cleanText(text = '') {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/ +$/g, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/** Lower-case, strip accents and unify apostrophes/dashes for comparison. */
export function normalizeWord(word = '') {
  if (word === '&') return 'and';
  return word
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’ʼ‘`´]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .toLowerCase();
}

/** Extract the bare words from arbitrary text. */
export function extractWords(text = '') {
  return String(text).match(WORD_RE) ?? [];
}

/** Words of a text, normalised for comparison. */
export function normalizedWords(text = '') {
  return extractWords(text).map(normalizeWord);
}

/**
 * Parse text into lines of tokens.
 * Every word token receives a sequential `index` across the whole passage.
 */
export function parsePassage(text = '') {
  const lines = cleanText(text).split('\n');
  let wordIndex = 0;
  const parsed = lines.map((line, lineIndex) => {
    const tokens = [];
    let last = 0;
    for (const match of line.matchAll(WORD_RE)) {
      if (match.index > last) {
        tokens.push({ type: 'gap', text: line.slice(last, match.index) });
      }
      tokens.push({ type: 'word', text: match[0], index: wordIndex++, line: lineIndex });
      last = match.index + match[0].length;
    }
    if (last < line.length) tokens.push({ type: 'gap', text: line.slice(last) });
    return tokens;
  });
  return { lines: parsed, wordCount: wordIndex };
}

/** Basic statistics shown on the compose screen. */
export function textStats(text = '') {
  const cleaned = cleanText(text);
  const words = extractWords(cleaned).length;
  const lines = cleaned ? cleaned.split('\n').filter((l) => l.trim()).length : 0;
  return { words, lines };
}

/** True when two words match, ignoring case, accents and apostrophe style. */
export function wordsMatch(a, b) {
  return normalizeWord(a) === normalizeWord(b);
}

/**
 * Split a passage into "units" to practise one at a time (Flash mode).
 * Poems naturally break into lines; long prose lines are further split at
 * sentence or clause boundaries so each unit can be held in short-term memory.
 */
export function splitIntoUnits(text = '', maxLength = 120) {
  const units = [];
  for (const rawLine of cleanText(text).split('\n')) {
    const line = rawLine.trim();
    if (!line || extractWords(line).length === 0) continue;
    if (line.length <= maxLength) {
      units.push(line);
      continue;
    }
    // Sentence-ish pieces, keeping their trailing punctuation.
    const pieces = line.match(/[^.!?;:]+(?:[.!?;:]+["'’”)\]]*\s*|$)/g) ?? [line];
    let current = '';
    for (const piece of pieces) {
      if (!piece.trim()) continue;
      if (current && (current + piece).trim().length > maxLength) {
        units.push(current.trim());
        current = '';
      }
      current += piece;
      // A single over-long clause: break at commas, then at word boundaries.
      while (current.trim().length > maxLength * 1.5) {
        const slice = current.slice(0, maxLength);
        let cut = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf(' — '));
        if (cut < maxLength / 3) cut = slice.lastIndexOf(' ');
        if (cut <= 0) cut = maxLength;
        units.push(current.slice(0, cut + 1).trim());
        current = current.slice(cut + 1);
      }
    }
    if (current.trim()) units.push(current.trim());
  }
  return units;
}

/**
 * Compare an attempt against the expected text word by word.
 * Returns whether it matches plus a per-word breakdown of the expected words
 * (`ok`, `wrong` or `missing`) and the count of extra words typed.
 */
export function compareAttempt(expected, attempt) {
  const want = extractWords(expected);
  const got = normalizedWords(attempt);
  const words = want.map((word, i) => {
    if (i >= got.length) return { word, status: 'missing' };
    return { word, status: normalizeWord(word) === got[i] ? 'ok' : 'wrong' };
  });
  const extra = Math.max(0, got.length - want.length);
  const correct = extra === 0 && words.every((w) => w.status === 'ok');
  const okCount = words.filter((w) => w.status === 'ok').length;
  return { correct, words, extra, score: want.length ? okCount / want.length : 1 };
}

/** Progressive hint for a word: level 1 shows ~1/3 of the letters, 2+ all. */
export function hintFor(word, level) {
  if (level <= 0) return '';
  if (level >= 2) return word;
  const shown = Math.max(1, Math.ceil(word.length / 3));
  return word.slice(0, shown) + '·'.repeat(word.length - shown);
}

/** Small deterministic PRNG so tests (and "same blanks again") are stable. */
export function createRng(seed = Date.now()) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Choose which words to blank out in Cloze mode.
 * `ratio` is the fraction of eligible words to hide (0–1). Single-letter words
 * are only used when nothing else is available. At least one word is hidden
 * whenever the passage has any words at all.
 */
export function chooseBlanks(wordList, ratio, rng = Math.random) {
  const all = wordList.map((_, i) => i);
  if (all.length === 0) return new Set();
  let eligible = all.filter((i) => wordList[i].length > 1);
  if (eligible.length === 0) eligible = all;
  const count = Math.min(eligible.length, Math.max(1, Math.round(eligible.length * ratio)));
  const pool = [...eligible];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return new Set(pool.slice(0, count));
}

/** How long to show a line in Flash mode, scaled to its length. */
export function displayDuration(line) {
  const words = extractWords(line).length;
  return Math.min(12000, Math.max(2500, 1200 + words * 450));
}
