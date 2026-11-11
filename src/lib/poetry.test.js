import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRandomPoem } from './poetry';

const poem = (title, n) => ({ title, author: 'Anon', lines: Array.from({ length: n }, (_, i) => `Line ${i + 1}   `) });

afterEach(() => vi.unstubAllGlobals());

function mockFetch(body, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 503, json: async () => body }));
}

describe('fetchRandomPoem', () => {
  it('prefers a poem of learnable length and trims lines', async () => {
    mockFetch([poem('Epic', 900), poem('Couplet', 2), poem('Just right', 14)]);
    const p = await fetchRandomPoem();
    expect(p.title).toBe('Just right');
    expect(p.text.split('\n')).toHaveLength(14);
    expect(p.text.endsWith('Line 14')).toBe(true);
  });

  it('falls back to the shortest poem when none fit', async () => {
    mockFetch([poem('Epic', 900), poem('Long', 120)]);
    expect((await fetchRandomPoem()).title).toBe('Long');
  });

  it('skips the excluded title', async () => {
    mockFetch([poem('Same', 10), poem('Other', 10)]);
    expect((await fetchRandomPoem({ exclude: 'Same' })).title).toBe('Other');
  });

  it('throws on HTTP errors and malformed responses', async () => {
    mockFetch([], false);
    await expect(fetchRandomPoem()).rejects.toThrow(/503/);
    mockFetch({ status: 404, reason: 'Not found' });
    await expect(fetchRandomPoem()).rejects.toThrow();
  });
});
