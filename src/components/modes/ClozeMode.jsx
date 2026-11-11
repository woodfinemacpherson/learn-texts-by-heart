import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Kbd, ProgressBar, Stat, Victory } from '../ui';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import { chooseBlanks, createRng, hintFor, parsePassage, wordsMatch } from '../../lib/text';
import { useSetting } from '../../lib/useSetting';
import { shake } from './effects';

const MAX_ATTEMPTS = 3; // the word is revealed after this many misses

export default function ClozeMode({ text }) {
  const [ratio, setRatio] = useSetting('clozeRatio', 0.3);
  const [seed, setSeed] = useState(() => Date.now());
  const [round, setRound] = useState(0);
  const sliderId = useId();

  const parsed = useMemo(() => parsePassage(text), [text]);
  const words = useMemo(() => parsed.lines.flat().filter((t) => t.type === 'word'), [parsed]);
  const blanks = useMemo(
    () => chooseBlanks(words.map((w) => w.text), ratio, createRng(seed)),
    [words, ratio, seed],
  );

  const pct = Math.round(ratio * 100);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-line bg-surface-2/60 px-4 py-3">
        <label htmlFor={sliderId} className="font-heading text-sm font-semibold text-ink-soft">
          Hide
        </label>
        <input
          id={sliderId}
          type="range"
          min={10}
          max={100}
          step={10}
          value={pct}
          onChange={(e) => setRatio(Number(e.target.value) / 100)}
          aria-valuetext={`${pct}% of words hidden`}
          className="h-2 min-w-32 flex-1 cursor-pointer"
        />
        <span className="w-28 font-heading text-sm font-semibold text-accent tabular-nums">
          {pct}% of words
        </span>
        <Button size="sm" icon={Icon.Shuffle} onClick={() => setSeed((s) => s + 1)} className="max-sm:flex-1">
          New gaps
        </Button>
      </div>

      <ClozeBoard
        key={`${seed}:${pct}:${round}`}
        parsed={parsed}
        words={words}
        blanks={blanks}
        onRetry={() => setRound((r) => r + 1)}
        onNew={() => setSeed((s) => s + 1)}
        onHarder={ratio < 1 ? () => setRatio((r) => Math.min(1, Math.round((r + 0.2) * 10) / 10)) : null}
      />
    </div>
  );
}

function ClozeBoard({ parsed, words, blanks, onRetry, onNew, onHarder }) {
  const order = useMemo(() => [...blanks].sort((a, b) => a - b), [blanks]);
  const [entries, setEntries] = useState({}); // index -> { value, attempts, status }
  const inputs = useRef({});
  const pendingFocus = useRef(order[0] ?? null);

  const entry = (i) => entries[i] ?? { value: '', attempts: 0, status: 'open' };
  const solved = order.filter((i) => entry(i).status !== 'open').length;
  const firstTry = order.filter((i) => entry(i).status === 'correct' && entry(i).attempts === 0).length;
  const revealed = order.filter((i) => entry(i).status === 'revealed').length;
  const done = order.length > 0 && solved === order.length;

  useEffect(() => {
    if (pendingFocus.current == null) return;
    const el = inputs.current[pendingFocus.current];
    pendingFocus.current = null;
    el?.focus({ preventScroll: false });
  });

  const nextOpen = (from, next, dir = 1) => {
    const isOpen = (i) => (next[i]?.status ?? 'open') === 'open';
    const pos = order.indexOf(from);
    for (let step = 1; step < order.length; step++) {
      const i = order[(pos + dir * step + order.length * step) % order.length];
      if (isOpen(i)) return i;
    }
    return null;
  };

  const commit = (i, patch, moveOn) => {
    const next = { ...entries, [i]: { ...entry(i), ...patch } };
    setEntries(next);
    if (moveOn) pendingFocus.current = nextOpen(i, next);
  };

  const attempt = (i, raw) => {
    const value = raw.trim();
    const word = words[i].text;
    if (!value) return;
    if (wordsMatch(value, word)) {
      commit(i, { value: word, status: 'correct' }, true);
      return;
    }
    const attempts = entry(i).attempts + 1;
    shake(inputs.current[i]);
    if (attempts >= MAX_ATTEMPTS) commit(i, { value: word, attempts, status: 'revealed' }, true);
    else commit(i, { value: '', attempts });
  };

  const onChange = (i, e) => {
    const raw = e.target.value;
    // A typed space or punctuation mark submits the word (works on mobile keyboards too).
    if (/[\s.,;:!?"“”()]$/.test(raw)) {
      attempt(i, raw.replace(/[\s.,;:!?"“”()]+$/, ''));
      return;
    }
    if (wordsMatch(raw.trim(), words[i].text)) {
      commit(i, { value: words[i].text, status: 'correct' }, true);
      return;
    }
    commit(i, { value: raw });
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.currentTarget.value.trim()) attempt(i, e.currentTarget.value);
      else {
        const n = nextOpen(i, entries);
        if (n != null) inputs.current[n]?.focus();
      }
    } else if (e.key === 'Backspace' && !e.currentTarget.value) {
      const prev = nextOpen(i, entries, -1);
      if (prev != null && prev < i) {
        e.preventDefault();
        inputs.current[prev]?.focus();
      }
    }
  };

  const revealAll = () => {
    const next = { ...entries };
    for (const i of order) {
      if (entry(i).status === 'open') next[i] = { ...entry(i), value: words[i].text, status: 'revealed' };
    }
    setEntries(next);
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <ProgressBar value={order.length ? solved / order.length : 0} label="Gaps filled" className="flex-1" />
        <span className="font-heading text-sm font-semibold text-ink-soft tabular-nums">
          {solved}/{order.length}
        </span>
      </div>

      <div className="font-serif text-[1.2rem] leading-[2.35] text-ink sm:text-[1.3rem]">
        {parsed.lines.map((tokens, li) =>
          tokens.length === 0 ? (
            <div key={li} className="h-4" aria-hidden="true" />
          ) : (
            <p key={li} className="pl-[1.5em] -indent-[1.5em] whitespace-pre-wrap">
              {tokens.map((t, ti) => {
                if (t.type === 'gap') return <span key={ti}>{t.text}</span>;
                if (!blanks.has(t.index)) return <span key={ti}>{t.text}</span>;
                const e = entry(t.index);
                if (e.status !== 'open') {
                  return (
                    <span
                      key={ti}
                      className={cx(
                        'rounded-sm px-0.5 underline decoration-2 underline-offset-[0.3em]',
                        e.status === 'correct'
                          ? 'text-good decoration-good/50'
                          : 'text-warn decoration-warn/60 decoration-dotted',
                      )}
                      title={e.status === 'revealed' ? 'Revealed' : undefined}
                    >
                      {t.text}
                    </span>
                  );
                }
                return (
                  <input
                    key={ti}
                    ref={(el) => {
                      inputs.current[t.index] = el;
                    }}
                    value={e.value}
                    onChange={(ev) => onChange(t.index, ev)}
                    onKeyDown={(ev) => onKeyDown(t.index, ev)}
                    placeholder={hintFor(t.text, e.attempts)}
                    aria-label={`Missing word ${order.indexOf(t.index) + 1} of ${order.length}${
                      e.attempts ? `, hint: ${hintFor(t.text, e.attempts).replace(/·/g, ' blank')}` : ''
                    }`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    style={{ width: `${Math.max(2, t.text.length) * 0.62 + 1}em` }}
                    className={cx(
                      'mx-px inline-block h-[1.55em] rounded-t-md border-0 border-b-2 px-1 text-center align-baseline font-serif leading-none text-ink indent-0',
                      'transition-colors outline-none placeholder:text-ink-faint/70 placeholder:tracking-wider focus:bg-gold-soft/45',
                      e.attempts > 0 ? 'border-bad bg-bad-soft/60' : 'border-line-strong bg-surface-2 focus:border-accent',
                    )}
                  />
                );
              })}
            </p>
          ),
        )}
      </div>

      {done ? (
        <div className="mt-8">
          <Victory
            title={revealed === 0 ? 'Every gap restored!' : 'The text is whole again'}
            stats={
              <>
                <Stat label="first try" value={`${firstTry}/${order.length}`} />
                <Stat label="with hints" value={solved - firstTry - revealed} />
                <Stat label="revealed" value={revealed} />
              </>
            }
            actions={
              <>
                <Button variant="primary" icon={Icon.Shuffle} onClick={onNew}>
                  New gaps
                </Button>
                {onHarder && (
                  <Button icon={Icon.Flame} onClick={onHarder}>
                    Hide more
                  </Button>
                )}
                <Button variant="ghost" icon={Icon.Restart} onClick={onRetry}>
                  Same again
                </Button>
              </>
            }
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-[0.95rem] text-ink-soft">
            Type each missing word; <Kbd>Space</Kbd> or <Kbd>Enter</Kbd> to check. Three misses reveal it.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={Icon.Restart} onClick={onRetry}>
              Restart
            </Button>
            <Button size="sm" variant="ghost" icon={Icon.Eye} onClick={revealAll}>
              Reveal all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
