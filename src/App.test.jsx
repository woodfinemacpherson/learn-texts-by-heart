import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const POEM = 'Out of the night that covers me,\nBlack as the pit from pole to pole,';

function seed(text = POEM, title = 'Invictus') {
  window.localStorage.setItem('learn-by-heart:passage', JSON.stringify({ title, author: 'W. E. Henley', text }));
}

beforeEach(() => {
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => vi.useRealTimers());

describe('compose screen', () => {
  it('starts with a passage from the treasury and lets the user edit it', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByLabelText('Title')).toHaveValue('Ozymandias');
    const text = screen.getByLabelText('Text to learn');
    await user.clear(text);
    await user.type(text, 'Two words');
    expect(screen.getByText('1 line · 2 words')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('learn-by-heart:passage')).text).toBe('Two words');
  });

  it('disables practice until there is text, and clearing can be undone', async () => {
    const user = userEvent.setup();
    seed();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByLabelText('Text to learn')).toHaveValue('');
    expect(screen.getByRole('button', { name: /cloze/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Text to learn')).toHaveValue(POEM);
    expect(screen.getByRole('button', { name: /cloze/i })).toBeEnabled();
  });

  it('loads a passage from the treasury', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /treasury/i }));
    await user.click(screen.getByRole('button', { name: /Sonnet 18/ }));
    expect(screen.getByLabelText('Title')).toHaveValue('Sonnet 18');
    expect(screen.getByLabelText('Text to learn').value).toMatch(/^Shall I compare thee/);
  });

  it('fetches a random poem and reports failures gracefully', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ title: 'Fetched', author: 'Poet', lines: ['a b c', 'd e f', 'g h i', 'j k l'] }] })
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    await user.click(screen.getByRole('button', { name: /random poem/i }));
    expect(await screen.findByDisplayValue('Fetched')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /random poem/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/PoetryDB is closed/);
    expect(screen.getByLabelText('Title')).toHaveValue('Fetched');
    vi.unstubAllGlobals();
  });
});

describe('navigation', () => {
  it('opens a mode via the hash, switches modes and returns to the editor', async () => {
    const user = userEvent.setup();
    seed();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /initials/i }));
    expect(window.location.hash).toBe('#/initials');
    expect(screen.getByRole('heading', { name: 'Invictus' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Flow' }));
    expect(window.location.hash).toBe('#/flow');
    expect(screen.getByRole('textbox', { name: /recite/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /edit text/i }));
    expect(screen.getByLabelText('Text to learn')).toBeInTheDocument();
  });

  it('ignores a practice URL when there is no text', () => {
    seed('   ');
    window.location.hash = '#/cloze';
    render(<App />);
    expect(screen.getByLabelText('Text to learn')).toBeInTheDocument();
  });
});

describe('cloze mode', () => {
  it('accepts correct words, gives hints after misses and celebrates completion', async () => {
    const user = userEvent.setup();
    seed('Shall I compare thee');
    localStorage.setItem('learn-by-heart:settings.clozeRatio', '1');
    window.location.hash = '#/cloze';
    render(<App />);
    const blanks = screen.getAllByRole('textbox', { name: /missing word/i });
    expect(blanks).toHaveLength(3); // "I" is too short to hide
    expect(blanks[0]).toHaveFocus();

    await user.keyboard('shell ');
    expect(blanks[0]).toHaveAttribute('placeholder', 'Sh···');
    expect(blanks[0]).toHaveFocus();
    await user.keyboard('SHALL');
    // Correct word is accepted at once and focus moves on.
    expect(screen.getByText('Shall')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /missing word/i })[0]).toHaveFocus();
    await user.keyboard('compare,');
    await user.keyboard('x{Enter}x{Enter}x{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('The text is whole again');
    expect(screen.getByRole('status')).toHaveTextContent('1/3first try');
  });

  it('reveals all remaining words on request', async () => {
    const user = userEvent.setup();
    seed('Shall I compare thee');
    window.location.hash = '#/cloze';
    render(<App />);
    await user.click(screen.getByRole('button', { name: /reveal all/i }));
    expect(screen.queryAllByRole('textbox', { name: /missing word/i })).toHaveLength(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('initials mode', () => {
  it('shows first letters and reveals words on tap', async () => {
    const user = userEvent.setup();
    seed('Tyger Tyger, burning bright');
    window.location.hash = '#/initials';
    render(<App />);
    const word = screen.getByRole('button', { name: 'Reveal word 3' });
    expect(word).toHaveTextContent('b');
    await user.click(word);
    expect(screen.getByRole('button', { name: 'burning' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('radio', { name: /full text/i }));
    expect(screen.getByText('bright')).toBeInTheDocument();
  });
});

describe('flash mode', () => {
  it('shows a line, hides it, checks the answer and moves on', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    seed();
    window.location.hash = '#/flash';
    render(<App />);
    expect(screen.getByText('Line 1 of 2')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(13000));
    expect(screen.getByText(/now, from memory/i)).toBeInTheDocument();

    const box = screen.getByLabelText(/type the line/i);
    await user.type(box, 'out of the day that covers me{Enter}');
    expect(screen.getByText(/not quite/i)).toHaveTextContent('1 word differs');

    fireEvent.change(box, { target: { value: 'Out of the night that covers me' } });
    await user.type(box, '{Enter}');
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText('Line 2 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /skip/i }));
    const status = screen.getByRole('status');
    expect(within(status).getByText('0/2')).toBeInTheDocument();
    expect(within(status).getByRole('button', { name: /from the beginning/i })).toBeInTheDocument();
  });
});

describe('flow mode', () => {
  it('tracks progress, flags mistakes, undoes them and completes', async () => {
    const user = userEvent.setup();
    seed();
    window.location.hash = '#/flow';
    render(<App />);
    const box = screen.getByRole('textbox', { name: /recite/i });
    expect(box).toHaveFocus();
    await user.type(box, 'Out of the night that covers me, black as the pot ');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/strays at word 11/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hint' }));
    expect(screen.getByText('“p··”')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /undo mistake/i }));
    expect(box).toHaveValue('Out of the night that covers me, black as the ');
    await user.type(box, 'pit from pole to pole');
    expect(screen.getByRole('status')).toHaveTextContent('You reached the end of the road');
  });
});
