import { describe, expect, it } from 'vitest';
import {
  chooseBlanks,
  cleanText,
  compareAttempt,
  createRng,
  displayDuration,
  extractWords,
  hintFor,
  normalizeWord,
  parsePassage,
  splitIntoUnits,
  textStats,
  wordsMatch,
} from './text';

describe('cleanText', () => {
  it('normalises line endings, odd spaces and trailing blank lines', () => {
    expect(cleanText('\n\nOne two  \r\nthree\r\n\n')).toBe('One two\nthree');
  });
});

describe('extractWords / parsePassage', () => {
  it('keeps apostrophes and hyphens inside words but strips punctuation', () => {
    expect(extractWords("O'er the well-known hills, 'tis said—“yes!”")).toEqual([
      "O'er", 'the', 'well-known', 'hills', 'tis', 'said', 'yes',
    ]);
  });

  it('treats an ampersand as a word', () => {
    expect(extractWords('shoulder, & what art')).toEqual(['shoulder', '&', 'what', 'art']);
  });

  it('handles accented and non-Latin letters', () => {
    expect(extractWords('Café déjà vu, Москва')).toEqual(['Café', 'déjà', 'vu', 'Москва']);
  });

  it('parses lines into word and gap tokens with sequential indices', () => {
    const { lines, wordCount } = parsePassage('Hello, world!\n\nAgain.');
    expect(wordCount).toBe(3);
    expect(lines).toHaveLength(3);
    expect(lines[0].map((t) => t.text).join('')).toBe('Hello, world!');
    expect(lines[0].filter((t) => t.type === 'word').map((t) => t.index)).toEqual([0, 1]);
    expect(lines[1]).toEqual([]);
    expect(lines[2][0]).toMatchObject({ type: 'word', text: 'Again', index: 2 });
  });
});

describe('normalizeWord / wordsMatch', () => {
  it('ignores case, accents and apostrophe style', () => {
    expect(wordsMatch('Summer’s', "summer's")).toBe(true);
    expect(wordsMatch('naïve', 'NAIVE')).toBe(true);
    expect(wordsMatch('and', '&')).toBe(true);
    expect(wordsMatch('thee', 'the')).toBe(false);
    expect(normalizeWord('Well–known')).toBe('well-known');
  });
});

describe('textStats', () => {
  it('counts non-empty lines and words', () => {
    expect(textStats('One two\n\n three ')).toEqual({ words: 3, lines: 2 });
    expect(textStats('   ')).toEqual({ words: 0, lines: 0 });
  });
});

describe('splitIntoUnits', () => {
  it('uses lines for verse and skips blank or punctuation-only lines', () => {
    expect(splitIntoUnits('A line\n\n  ---  \nAnother line')).toEqual(['A line', 'Another line']);
  });

  it('splits long prose lines at sentence boundaries', () => {
    const prose =
      'Four score and seven years ago our fathers brought forth on this continent a new nation. ' +
      'Now we are engaged in a great civil war, testing whether that nation can long endure. ' +
      'We are met on a great battle-field of that war.';
    const units = splitIntoUnits(prose);
    expect(units.length).toBeGreaterThan(1);
    expect(units.every((u) => u.length <= 180)).toBe(true);
    expect(units.join(' ')).toBe(prose);
  });

  it('breaks a single over-long clause without losing words', () => {
    const clause = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const units = splitIntoUnits(clause);
    expect(units.length).toBeGreaterThan(1);
    expect(units.join(' ').split(' ')).toEqual(clause.split(' '));
  });
});

describe('compareAttempt', () => {
  it('accepts attempts that differ only in case and punctuation', () => {
    expect(compareAttempt('Shall I compare thee to a summer’s day?', "shall i compare thee to a summer's day").correct).toBe(true);
  });

  it('reports wrong, missing and extra words', () => {
    const r = compareAttempt('The lone and level sands', 'the long and level');
    expect(r.correct).toBe(false);
    expect(r.words.map((w) => w.status)).toEqual(['ok', 'wrong', 'ok', 'ok', 'missing']);
    expect(compareAttempt('one two', 'one two three').extra).toBe(1);
  });
});

describe('hintFor', () => {
  it('reveals progressively', () => {
    expect(hintFor('unconquerable', 0)).toBe('');
    expect(hintFor('unconquerable', 1)).toBe('uncon········');
    expect(hintFor('unconquerable', 2)).toBe('unconquerable');
    expect(hintFor('me', 1)).toBe('m·');
  });
});

describe('chooseBlanks', () => {
  const words = 'I met a traveller from an antique land'.split(' ');

  it('hides the requested share of multi-letter words', () => {
    const blanks = chooseBlanks(words, 0.5, createRng(1));
    expect(blanks.size).toBe(3); // 6 eligible words
    for (const i of blanks) expect(words[i].length).toBeGreaterThan(1);
  });

  it('is deterministic for a seed and always hides at least one word', () => {
    expect([...chooseBlanks(words, 0.3, createRng(42))]).toEqual([...chooseBlanks(words, 0.3, createRng(42))]);
    expect(chooseBlanks(['a'], 0.1).size).toBe(1);
    expect(chooseBlanks([], 0.5).size).toBe(0);
    expect(chooseBlanks(words, 1).size).toBe(6);
  });
});

describe('displayDuration', () => {
  it('scales with length within sensible bounds', () => {
    expect(displayDuration('Hi')).toBe(2500);
    expect(displayDuration('one two three four five six seven eight')).toBeGreaterThan(2500);
    expect(displayDuration('word '.repeat(100))).toBe(12000);
  });
});
