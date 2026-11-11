import { Button, Segmented } from './ui';
import { Icon } from './icons';
import { MODES } from '../lib/modes';
import ClozeMode from './modes/ClozeMode';
import FlowMode from './modes/FlowMode';
import FlashMode from './modes/FlashMode';
import InitialsMode from './modes/InitialsMode';

const COMPONENTS = { cloze: ClozeMode, flow: FlowMode, flash: FlashMode, initials: InitialsMode };

export default function PracticeScreen({ passage, mode, onModeChange, onBack }) {
  const Mode = COMPONENTS[mode];
  const info = MODES.find((m) => m.id === mode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" icon={Icon.Back} onClick={onBack} className="-ml-2">
          Edit text
        </Button>
        <Segmented
          label="Practice mode"
          value={mode}
          onChange={onModeChange}
          size="sm"
          options={MODES.map((m) => ({ value: m.id, label: m.name, icon: m.icon }))}
          className="max-sm:w-full"
        />
      </div>

      <section aria-labelledby="practice-title" className="folio folio-frame animate-rise p-4 sm:p-7" key={mode}>
        <header className="mb-5 text-center">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-gold uppercase">
            {info.name} · {info.tagline}
          </p>
          <h2 id="practice-title" className="mt-1 font-heading text-xl font-bold text-ink text-balance sm:text-2xl">
            {passage.title.trim() || 'Untitled'}
          </h2>
          {passage.author.trim() && <p className="text-ink-soft italic">{passage.author}</p>}
        </header>
        <Mode text={passage.text} />
      </section>
    </div>
  );
}
