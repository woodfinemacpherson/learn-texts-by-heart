import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, ProgressBar, Stat, Victory } from '../ui';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import { checkRecital } from '../../lib/flow';
import { cleanText, extractWords, hintFor } from '../../lib/text';
import { shake } from './effects';

function formatTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function FlowMode({ text }) {
  const [round, setRound] = useState(0);
  return <FlowRound key={round} text={text} onAgain={() => setRound((r) => r + 1)} />;
}

function FlowRound({ text, onAgain }) {
  const expected = useMemo(() => extractWords(text), [text]);
  const [input, setInput] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState({ index: -1, level: 0 });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [peeks, setPeeks] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const areaRef = useRef(null);
  const feedbackId = useId();

  const result = useMemo(() => checkRecital(expected, input), [expected, input]);
  const target = result.error ? result.errorIndex : result.matched;
  const hintLevel = hint.index === target ? hint.level : 0;

  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  const onChange = (e) => {
    const value = e.target.value;
    const next = checkRecital(expected, value);
    if (next.error && !result.error) {
      setMistakes((m) => m + 1);
      shake(areaRef.current);
    }
    if (!startedAt && value) setStartedAt(Date.now());
    if (next.complete && !finishedAt) setFinishedAt(Date.now());
    setInput(value);
  };

  const giveHint = () => {
    const level = Math.min(2, hintLevel + 1);
    setHint({ index: target, level });
    setHintsUsed((h) => h + 1);
    areaRef.current?.focus();
  };

  const togglePeek = () => {
    if (!peeking) setPeeks((p) => p + 1);
    setPeeking((p) => !p);
  };

  /** Remove the mistaken part so the learner can carry on from the last good word. */
  const backtrack = () => {
    const words = extractWords(input).slice(0, result.matched);
    let pos = 0;
    let rebuilt = '';
    if (words.length) {
      // Keep the original input up to and including the last correct word.
      for (const w of words) pos = input.indexOf(w, pos) + w.length;
      rebuilt = input.slice(0, pos) + ' ';
    }
    setInput(rebuilt);
    const el = areaRef.current;
    if (el) {
      el.focus();
      requestAnimationFrame(() => el.setSelectionRange(rebuilt.length, rebuilt.length));
    }
  };

  if (result.complete) {
    const duration = finishedAt && startedAt ? finishedAt - startedAt : 0;
    const flawless = mistakes === 0 && hintsUsed === 0 && peeks === 0;
    return (
      <div className="space-y-6">
        <Victory
          title={flawless ? 'Recited without a stumble!' : 'You reached the end of the road'}
          stats={
            <>
              <Stat label="words" value={expected.length} />
              <Stat label="slips" value={mistakes} />
              <Stat label="hints" value={hintsUsed} />
              <Stat label="peeks" value={peeks} />
              {duration > 0 && <Stat label="time" value={formatTime(duration)} />}
            </>
          }
          actions={
            <Button variant="primary" icon={Icon.Restart} onClick={onAgain}>
              Recite again
            </Button>
          }
        />
        <div className="rounded-lg border border-line bg-surface-2/50 p-4 font-serif text-lg whitespace-pre-wrap text-ink-soft">
          {cleanText(text)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={expected.length ? result.matched / expected.length : 0} label="Words recited" className="flex-1" />
        <span className="font-heading text-sm font-semibold text-ink-soft tabular-nums">
          {result.matched}/{expected.length}
        </span>
      </div>

      {peeking && (
        <div className="animate-rise mb-4 max-h-64 overflow-y-auto rounded-lg border border-dashed border-line-strong bg-surface-2/60 p-4 font-serif text-lg whitespace-pre-wrap text-ink-soft">
          {cleanText(text)}
        </div>
      )}

      <textarea
        ref={areaRef}
        value={input}
        onChange={onChange}
        rows={10}
        aria-label="Recite the text from memory"
        aria-invalid={result.error}
        aria-describedby={feedbackId}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        placeholder="Begin your recitation here, from memory…"
        className={cx(
          'block min-h-64 w-full resize-y rounded-lg border-2 bg-surface-2/50 p-4 font-serif text-lg leading-relaxed text-ink transition-colors',
          'placeholder:text-ink-faint/80 focus:bg-surface focus:outline-none',
          result.error ? 'border-bad bg-bad-soft/40 focus:bg-bad-soft/40' : 'border-line focus:border-accent',
        )}
      />

      <div id={feedbackId} aria-live="polite" className="mt-3 min-h-[3.25rem]">
        {result.error ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-bad/30 bg-bad-soft px-3 py-2 text-bad">
            <span>
              {result.extra ? 'You have gone past the end of the text.' : `The path strays at word ${result.errorIndex + 1}.`}
              {hintLevel > 0 && !result.extra && (
                <>
                  {' '}
                  Expected <strong className="font-semibold">“{hintFor(expected[target], hintLevel)}”</strong>.
                </>
              )}
            </span>
            <Button size="sm" variant="ghost" onClick={backtrack} className="-my-1 text-bad hover:bg-bad/10">
              Undo mistake
            </Button>
          </div>
        ) : hintLevel > 0 ? (
          <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink-soft">
            Next word: <strong className="font-semibold text-accent">“{hintFor(expected[target], hintLevel)}”</strong>
          </p>
        ) : (
          <p className="px-1 py-2 text-[0.95rem] text-ink-faint">
            Case and punctuation are forgiven — only the words must be right.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Button size="sm" variant="ghost" icon={peeking ? Icon.EyeOff : Icon.Eye} onClick={togglePeek} aria-pressed={peeking}>
          {peeking ? 'Hide text' : 'Peek'}
        </Button>
        <Button size="sm" icon={Icon.Lantern} onClick={giveHint} disabled={result.extra || hintLevel >= 2}>
          {hintLevel === 0 ? 'Hint' : 'Show word'}
        </Button>
      </div>
    </div>
  );
}
