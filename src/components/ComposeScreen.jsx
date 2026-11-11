import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './ui';
import { Icon } from './icons';
import { MODES } from '../lib/modes';
import { cx } from '../lib/cx';
import { PASSAGES } from '../data/passages';
import { fetchRandomPoem } from '../lib/poetry';
import { textStats } from '../lib/text';

export default function ComposeScreen({ passage, onChange, onStart }) {
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: 'info' | 'error', text, undo? }
  const abortRef = useRef(null);
  const ids = { title: useId(), author: useId(), text: useId(), treasury: useId() };
  const stats = textStats(passage.text);
  const empty = stats.words === 0;

  useEffect(() => () => abortRef.current?.abort(), []);

  const replacePassage = (next, message) => {
    const previous = passage;
    const hadText = previous.text.trim() && previous.text !== next.text;
    onChange(next);
    setNotice(
      hadText
        ? { kind: 'info', text: message, undo: () => { onChange(previous); setNotice(null); } }
        : null,
    );
  };

  const loadRandom = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setNotice(null);
    try {
      const poem = await fetchRandomPoem({ signal: controller.signal, exclude: passage.title });
      replacePassage(poem, `Summoned “${poem.title}”.`);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setNotice({
        kind: 'error',
        text: 'The road to PoetryDB is closed just now. Choose from the Treasury instead, or try again shortly.',
      });
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const choose = (p) => {
    replacePassage({ title: p.title, author: p.author, text: p.text }, `Opened “${p.title}”.`);
    setTreasuryOpen(false);
  };

  const clear = () => replacePassage({ title: '', author: '', text: '' }, 'Text cleared.');

  const update = (field) => (e) => {
    setNotice(null);
    onChange({ ...passage, [field]: e.target.value });
  };

  const inputClass =
    'w-full rounded-lg border border-line bg-surface-2/60 px-3 text-ink placeholder:text-ink-faint/80 transition-colors focus:border-accent focus:bg-surface focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-gold/30';

  return (
    <div className="animate-rise space-y-8">
      <section aria-labelledby="text-heading" className="folio folio-frame p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="text-heading" className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Icon.Quill className="size-5 text-gold" />
            Your text
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={loading ? Icon.Spinner : Icon.Dice} onClick={loadRandom} disabled={loading}>
              {loading ? 'Summoning…' : 'Random poem'}
            </Button>
            <Button
              size="sm"
              icon={Icon.Book}
              onClick={() => setTreasuryOpen((o) => !o)}
              aria-expanded={treasuryOpen}
              aria-controls={ids.treasury}
              className={treasuryOpen ? 'border-accent bg-surface-2' : undefined}
            >
              Treasury
              <Icon.Chevron className={cx('size-4 transition-transform', treasuryOpen && 'rotate-180')} />
            </Button>
          </div>
        </div>

        {treasuryOpen && (
          <div id={ids.treasury} className="animate-rise mt-4 rounded-lg border border-line bg-surface-2/50 p-2">
            <p className="px-2 pt-1 pb-2 text-sm text-ink-soft">Classic verse and prose, ready to learn:</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {PASSAGES.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choose(p)}
                    className={cx(
                      'w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-surface',
                      passage.title === p.title && passage.text === p.text && 'bg-surface ring-1 ring-line',
                    )}
                  >
                    <span className="block font-heading text-[0.95rem] leading-snug font-semibold text-accent">{p.title}</span>
                    <span className="block text-[0.95rem] text-ink-soft italic">{p.author}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {notice && (
          <div
            role={notice.kind === 'error' ? 'alert' : 'status'}
            className={cx(
              'animate-rise mt-4 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[0.95rem]',
              notice.kind === 'error' ? 'border-bad/30 bg-bad-soft text-bad' : 'border-line bg-surface-2 text-ink-soft',
            )}
          >
            <span>{notice.text}</span>
            {notice.undo && (
              <Button size="sm" variant="ghost" onClick={notice.undo} className="-my-1">
                Undo
              </Button>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-[3fr_2fr]">
          <div>
            <label htmlFor={ids.title} className="mb-1 block font-heading text-xs font-semibold tracking-widest text-ink-soft uppercase">
              Title
            </label>
            <input id={ids.title} value={passage.title} onChange={update('title')} placeholder="Untitled" className={cx(inputClass, 'h-11 font-heading font-semibold')} />
          </div>
          <div>
            <label htmlFor={ids.author} className="mb-1 block font-heading text-xs font-semibold tracking-widest text-ink-soft uppercase">
              Author
            </label>
            <input id={ids.author} value={passage.author} onChange={update('author')} placeholder="Unknown" className={cx(inputClass, 'h-11 italic')} />
          </div>
        </div>

        <label htmlFor={ids.text} className="mt-4 mb-1 block font-heading text-xs font-semibold tracking-widest text-ink-soft uppercase">
          Text to learn
        </label>
        <textarea
          id={ids.text}
          value={passage.text}
          onChange={update('text')}
          rows={12}
          spellCheck={false}
          placeholder={'Paste or write the poem or passage you wish to learn by heart…\n\nKeep its line breaks: each line becomes one step in Flash mode.'}
          className={cx(inputClass, 'block min-h-56 resize-y py-3 text-base leading-relaxed sm:text-lg')}
        />

        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span aria-live="polite">
            {empty ? 'No words yet' : `${stats.lines} ${stats.lines === 1 ? 'line' : 'lines'} · ${stats.words} ${stats.words === 1 ? 'word' : 'words'}`}
          </span>
          <Button size="sm" variant="danger" icon={Icon.Trash} onClick={clear} disabled={!passage.text && !passage.title && !passage.author}>
            Clear
          </Button>
        </div>
      </section>

      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="mb-1 text-center font-heading text-lg font-bold text-ink">
          Choose your trial
        </h2>
        <p className="mb-4 text-center text-ink-soft">
          {empty ? 'Add some text above to begin.' : 'Begin gently with Cloze or Initials, then test yourself with Flash and Flow.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={empty}
              onClick={() => onStart(m.id)}
              className="group folio flex items-start gap-4 p-4 text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
                <m.icon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-heading text-lg font-bold text-accent">{m.name}</span>
                  <span className="text-sm tracking-wide text-ink-faint uppercase">{m.tagline}</span>
                </span>
                <span className="mt-0.5 block leading-snug text-ink-soft">{m.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
