// Fetch a random, reasonably short poem from PoetryDB (https://poetrydb.org).
// Several candidates are requested at once so we can prefer one that is a
// sensible length to learn by heart, rather than a 900-line epic.

const ENDPOINT = 'https://poetrydb.org/random/8';
const MIN_LINES = 4;
const MAX_LINES = 32;

export async function fetchRandomPoem({ signal, exclude } = {}) {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) throw new Error(`PoetryDB responded with ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response from PoetryDB');

  const poems = data
    .filter((p) => p && Array.isArray(p.lines) && p.title)
    .map((p) => ({
      title: String(p.title).trim(),
      author: String(p.author ?? '').trim(),
      text: trimLines(p.lines),
    }))
    .filter((p) => p.text && p.title !== exclude);

  if (poems.length === 0) throw new Error('No poems found');

  const lineCount = (p) => p.text.split('\n').filter((l) => l.trim()).length;
  const fitting = poems.filter((p) => {
    const n = lineCount(p);
    return n >= MIN_LINES && n <= MAX_LINES;
  });
  if (fitting.length) return fitting[0];
  return poems.reduce((best, p) => (lineCount(p) < lineCount(best) ? p : best));
}

function trimLines(lines) {
  return lines
    .map((l) => String(l).replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
