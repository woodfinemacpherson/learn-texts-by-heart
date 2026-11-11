import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Kbd, ProgressBar, Stat, Victory } from '../ui';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import { compareAttempt, displayDuration, hintFor, splitIntoUnits } from '../../lib/text';
import { useSetting } from '../../lib/useSetting';
import { shake } from './effects';

export default function FlashMode({ text }) {
  const units = useMemo(() => splitIntoUnits(text), [text]);
  const [round, setRound] = useState({ id: 0, pool: null });
  const pool = round.pool ?? units.map((_, i) => i);
  return (
    <FlashRound
      key={round.id}
      units={units}
      pool={pool}
      onRestart={(subset) => setRound((r) => ({ id: r.id + 1, pool: subset }))}
    />
  );
}

function FlashRound({ units, pool, onRestart }) {
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState('show'); // show | recall | correct | done
  const [showKey, setShowKey] = useState(0);
  const [input, setInput] = useState('');
  const [diff, setDiff] = useState(null);
  const [results, setResults] = useState({}); // unit index -> { status, misses, peeks }
  const [showContext, setShowContext] = useSetting('flashContext', true);
  const [speed, setSpeed] = useSetting('flashSpeed', 1);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const contextRef = useRef(null);

  const unitIndex = pool[pos];
  const line = units[unitIndex] ?? '';
  const duration = displayDuration(line) * speed;
  const current = results[unitIndex] ?? { misses: 0, peeks: 0 };

  // Hide the line once its time is up.
  useEffect(() => {
    if (phase !== 'show') return;
    const timer = setTimeout(() => setPhase('recall'), duration);
    return () => clearTimeout(timer);
  }, [phase, showKey, pos, duration]);

  // After a correct answer, pause briefly to celebrate, then move on.
  useEffect(() => {
    if (phase !== 'correct') return;
    const timer = setTimeout(() => {
      if (pos + 1 >= pool.length) {
        setPhase('done');
      } else {
        setPos(pos + 1);
        setPhase('show');
        setShowKey((k) => k + 1);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, pos, pool.length]);

  useEffect(() => {
    if (phase === 'show' || phase === 'recall') inputRef.current?.focus({ preventScroll: true });
  }, [phase, pos]);

  // Keep the most recent completed line in view.
  useEffect(() => {
    const el = contextRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pos, showContext]);

  const record = (patch) => setResults((r) => ({ ...r, [unitIndex]: { ...current, ...patch } }));

  const submit = () => {
    if (phase !== 'recall' && phase !== 'show') return;
    if (!input.trim()) {
      setPhase('recall');
      return;
    }
    const outcome = compareAttempt(line, input);
    if (outcome.correct) {
      const clean = current.misses === 0 && current.peeks === 0;
      record({ status: clean ? 'first' : 'retry' });
      setDiff(null);
      setInput('');
      setPhase('correct');
    } else {
      record({ misses: current.misses + 1 });
      setDiff(outcome);
      setPhase('recall');
      shake(formRef.current);
    }
  };

  const showAgain = () => {
    record({ peeks: current.peeks + 1 });
    setDiff(null);
    setInput('');
    setPhase('show');
    setShowKey((k) => k + 1);
  };

  const skip = () => {
    record({ status: 'skipped' });
    setDiff(null);
    setInput('');
    if (pos + 1 >= pool.length) {
      setPhase('done');
    } else {
      setPos(pos + 1);
      setPhase('show');
      setShowKey((k) => k + 1);
    }
  };

  const onType = (e) => {
    setInput(e.target.value);
    if (phase === 'show') setPhase('recall'); // typing early hides the line
  };

  if (phase === 'done') {
    const statuses = pool.map((i) => results[i]?.status ?? 'skipped');
    const first = statuses.filter((s) => s === 'first').length;
    const retried = statuses.filter((s) => s === 'retry').length;
    const skipped = statuses.filter((s) => s === 'skipped').length;
    const tricky = pool.filter((i) => results[i]?.status !== 'first');
    return (
      <div className="space-y-6">
        <Victory
          title={first === pool.length ? 'Flawless — every line at first sight!' : 'All lines attempted'}
          stats={
            <>
              <Stat label="first try" value={`${first}/${pool.length}`} />
              <Stat label="after retries" value={retried} />
              <Stat label="skipped" value={skipped} />
            </>
          }
          actions={
            <>
              {tricky.length > 0 && tricky.length < pool.length && (
                <Button variant="primary" icon={Icon.Flame} onClick={() => onRestart(tricky)}>
                  Practise the {tricky.length} tricky {tricky.length === 1 ? 'line' : 'lines'}
                </Button>
              )}
              <Button variant={tricky.length > 0 && tricky.length < pool.length ? 'secondary' : 'primary'} icon={Icon.Restart} onClick={() => onRestart(null)}>
                From the beginning
              </Button>
            </>
          }
        />
        <ol className="space-y-1.5 font-serif text-lg">
          {pool.map((i) => {
            const s = results[i]?.status ?? 'skipped';
            return (
              <li key={i} className="flex items-baseline gap-3">
                <span
                  className={cx(
                    'mt-1 size-2.5 shrink-0 translate-y-[-0.1em] rounded-full',
                    s === 'first' ? 'bg-good' : s === 'retry' ? 'bg-warn' : 'bg-bad',
                  )}
                  title={s === 'first' ? 'First try' : s === 'retry' ? 'After a retry' : 'Skipped'}
                />
                <span className={s === 'first' ? 'text-ink' : 'text-ink-soft'}>{units[i]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const done = pool.slice(0, pos).filter((i) => results[i]);
  const visible = phase === 'show' || phase === 'correct';

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={(pos + (phase === 'correct' ? 1 : 0)) / pool.length} label="Lines completed" className="flex-1" />
        <span className="font-heading text-sm font-semibold text-ink-soft tabular-nums">
          Line {pos + 1} of {pool.length}
        </span>
      </div>

      {showContext && done.length > 0 && (
        <ol ref={contextRef} aria-label="Lines already completed" className="mb-4 max-h-56 space-y-0.5 overflow-y-auto font-serif text-lg text-ink-faint">
          {done.map((i) => (
            <li key={i} className={results[i]?.status === 'skipped' ? 'italic opacity-70' : undefined}>
              {units[i]}
            </li>
          ))}
        </ol>
      )}

      <div
        className={cx(
          'relative grid min-h-36 place-items-center overflow-hidden rounded-xl border px-4 py-8 text-center transition-colors duration-300 sm:px-8',
          phase === 'correct' ? 'animate-glow border-good/60 bg-good-soft' : 'border-line bg-surface-2/60',
        )}
      >
        <p
          aria-live="polite"
          className={cx(
            'font-serif text-xl leading-relaxed text-balance transition-[opacity,filter] duration-300 sm:text-2xl',
            visible ? 'opacity-100 blur-0' : 'opacity-0 blur-sm select-none',
            phase === 'correct' ? 'text-good' : 'text-ink',
          )}
          aria-hidden={!visible}
        >
          {line}
        </p>
        {phase === 'recall' && (
          <p className="absolute inset-0 grid place-items-center px-4 font-heading text-sm tracking-[0.2em] text-ink-faint uppercase">
            Now, from memory…
          </p>
        )}
        {phase === 'correct' && (
          <Icon.Check className="absolute top-3 right-3 size-6 text-good" />
        )}
        {phase === 'show' && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-line/50">
            <div
              key={`${pos}:${showKey}`}
              className="h-full origin-left animate-[countdown_linear_forwards] bg-gold"
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>
        )}
      </div>

      <form
        ref={formRef}
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="flash-input" className="sr-only">
          Type the line from memory
        </label>
        <textarea
          id="flash-input"
          ref={inputRef}
          value={input}
          onChange={onType}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={phase === 'correct'}
          rows={2}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={phase === 'show' ? 'Start typing when you are ready…' : 'Type the line you just saw…'}
          className={cx(
            'block w-full resize-none rounded-lg border-2 bg-surface-2/50 px-4 py-3 font-serif text-lg leading-snug text-ink transition-colors',
            'placeholder:text-ink-faint/80 focus:bg-surface focus:outline-none disabled:opacity-60',
            diff ? 'border-bad' : 'border-line focus:border-accent',
          )}
        />

        <div aria-live="polite" className="min-h-0">
          {diff && (
            <div className="animate-rise mt-3 rounded-lg border border-bad/30 bg-bad-soft px-3 py-2">
              <p className="text-sm font-semibold text-bad">
                Not quite — {describe(diff)}
              </p>
              <p className="mt-1 font-serif text-lg leading-relaxed">
                {diff.words.map((w, i) => (
                  <span key={i}>
                    {i > 0 && ' '}
                    {w.status === 'ok' ? (
                      <span className="text-good">{w.word}</span>
                    ) : w.status === 'wrong' ? (
                      <span className="rounded-sm bg-bad/10 px-0.5 font-semibold tracking-wide text-bad">{hintFor(w.word, 1)}</span>
                    ) : (
                      <span className="tracking-wide text-ink-faint">{hintFor(w.word, 1)}</span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button type="submit" variant="primary" icon={Icon.Check} disabled={phase === 'correct'} className="max-sm:px-2 max-[400px]:[&>svg]:hidden">
            Check
          </Button>
          {phase === 'show' ? (
            <Button icon={Icon.EyeOff} onClick={() => setPhase('recall')} className="max-sm:px-2 max-[400px]:[&>svg]:hidden">
              Hide now
            </Button>
          ) : (
            <Button icon={Icon.Eye} onClick={showAgain} disabled={phase === 'correct'} className="max-sm:px-2 max-[400px]:[&>svg]:hidden">
              Show again
            </Button>
          )}
          <Button variant="ghost" icon={Icon.Skip} onClick={skip} disabled={phase === 'correct'} className="max-sm:px-2 max-[400px]:[&>svg]:hidden">
            Skip
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[0.95rem] text-ink-soft">
        <span className="max-sm:hidden">
          <Kbd>Enter</Kbd> to check · typing hides the line
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={showContext} onChange={(e) => setShowContext(e.target.checked)} className="size-4 accent-accent" />
            Show earlier lines
          </label>
          <label className="flex items-center gap-2">
            Glimpse
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-8 rounded-md border border-line bg-surface px-2 text-ink focus:border-accent focus:outline-none"
            >
              <option value={0.6}>Short</option>
              <option value={1}>Normal</option>
              <option value={1.6}>Long</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function describe(diff) {
  const wrong = diff.words.filter((w) => w.status === 'wrong').length;
  const missing = diff.words.filter((w) => w.status === 'missing').length;
  const parts = [];
  if (wrong) parts.push(`${wrong} ${wrong === 1 ? 'word differs' : 'words differ'}`);
  if (missing) parts.push(`${missing} ${missing === 1 ? 'word is' : 'words are'} missing`);
  if (diff.extra) parts.push(`${diff.extra} extra ${diff.extra === 1 ? 'word' : 'words'}`);
  return parts.join(', ') + '. Correct it and check again.';
}
