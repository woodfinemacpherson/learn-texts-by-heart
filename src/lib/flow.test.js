import { describe, expect, it } from 'vitest';
import { checkRecital } from './flow';
import { extractWords } from './text';

const words = extractWords("Out of the night that covers me, black as the pit; well-known o'er");

describe('checkRecital', () => {
  it('counts correct words and tolerates a word in progress', () => {
    expect(checkRecital(words, 'Out of the ni')).toMatchObject({ matched: 3, error: false });
    expect(checkRecital(words, 'Out of the night ')).toMatchObject({ matched: 4, error: false });
  });

  it('flags a finished word that is wrong', () => {
    expect(checkRecital(words, 'Out of the day ')).toMatchObject({ matched: 3, error: true, errorIndex: 3 });
  });

  it('flags a word in progress that cannot become the expected word', () => {
    expect(checkRecital(words, 'Out of thx')).toMatchObject({ error: true, errorIndex: 2 });
  });

  it('does not flag a hyphenated or apostrophised word while it is being typed', () => {
    const upTo = 'out of the night that covers me black as the pit ';
    expect(checkRecital(words, upTo + 'well-')).toMatchObject({ error: false });
    expect(checkRecital(words, upTo + "well-known o'")).toMatchObject({ error: false });
  });

  it('ignores case, punctuation and line breaks, and detects completion', () => {
    const r = checkRecital(words, "out of the night\nthat covers me—black as the pit, well-known O’er");
    expect(r).toMatchObject({ complete: true, error: false, matched: words.length });
  });

  it('flags extra words beyond the end', () => {
    const all = words.join(' ');
    expect(checkRecital(words, all + ' more')).toMatchObject({ error: true, extra: true });
  });
});
