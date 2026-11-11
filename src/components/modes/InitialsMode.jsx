import { useMemo, useState } from 'react';
import { Button, Segmented } from '../ui';
import { Icon } from '../icons';
import { cx } from '../../lib/cx';
import { parsePassage } from '../../lib/text';
import { useSetting } from '../../lib/useSetting';

const LEVELS = [
  { value: 'full', label: 'Full text', icon: Icon.Eye },
  { value: 'initials', label: 'Initials', icon: Icon.Rune },
  { value: 'hidden', label: 'Hidden', icon: Icon.EyeOff },
];

/** First character of a word (code-point aware, so it never splits a surrogate pair). */
function initial(word) {
  return [...word][0] ?? '';
}

export default function InitialsMode({ text }) {
  const [level, setLevel] = useSetting('initialsLevel', 'initials');
  const [revealed, setRevealed] = useState(() => new Set());
  const parsed = useMemo(() => parsePassage(text), [text]);

  const toggle = (i) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const changeLevel = (v) => {
    setLevel(v);
    setRevealed(new Set());
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/60 px-3 py-2.5">
        <Segmented label="How much to show" options={LEVELS} value={level} onChange={changeLevel} size="sm" narrowIcons={false} className="max-sm:w-full" />
        <Button size="sm" variant="ghost" icon={Icon.Restart} onClick={() => setRevealed(new Set())} disabled={revealed.size === 0} className="max-sm:w-full">
          Hide revealed ({revealed.size})
        </Button>
      </div>

      <div className="font-serif text-[1.25rem] leading-[2.1] text-ink sm:text-[1.35rem]">
        {parsed.lines.map((tokens, li) =>
          tokens.length === 0 ? (
            <div key={li} className="h-4" aria-hidden="true" />
          ) : (
            <p key={li} className="pl-[1.5em] -indent-[1.5em] whitespace-pre-wrap">
              {tokens.map((t, ti) => {
                if (t.type === 'gap') return <span key={ti}>{t.text}</span>;
                const shown = level === 'full' || revealed.has(t.index);
                return (
                  <button
                    key={ti}
                    type="button"
                    onClick={() => level !== 'full' && toggle(t.index)}
                    aria-label={shown ? t.text : `Reveal word ${t.index + 1}`}
                    aria-pressed={level === 'full' ? undefined : shown}
                    tabIndex={level === 'full' ? -1 : 0}
                    className={cx(
                      'rounded-sm indent-0 transition-colors',
                      level === 'full' ? 'cursor-text select-text' : 'hover:bg-gold-soft/50',
                      shown && level !== 'full' && 'text-accent',
                    )}
                  >
                    {shown ? (
                      t.text
                    ) : level === 'initials' ? (
                      <span className="font-semibold">{initial(t.text)}</span>
                    ) : (
                      <span
                        className="inline-block h-[0.2em] translate-y-[-0.2em] rounded-full bg-line-strong/70 align-baseline"
                        style={{ width: `${Math.max(1, t.text.length) * 0.5}em` }}
                      />
                    )}
                  </button>
                );
              })}
            </p>
          ),
        )}
      </div>

      <p className="mt-8 border-t border-line pt-4 text-[0.95rem] text-ink-soft">
        {level === 'full'
          ? 'Read the text aloud a few times, then switch to Initials.'
          : 'Recite aloud from the cues. Tap any word you cannot recall to reveal it; tap again to hide it.'}
      </p>
    </div>
  );
}
