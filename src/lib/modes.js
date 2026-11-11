import { Icon } from '../components/icons';

export const MODES = [
  {
    id: 'cloze',
    name: 'Cloze',
    tagline: 'Fill the gaps',
    icon: Icon.Gaps,
    description: 'Words vanish from the text. Restore each one; hints appear when you stumble.',
  },
  {
    id: 'initials',
    name: 'Initials',
    tagline: 'First-letter cues',
    icon: Icon.Rune,
    description: 'Recite aloud from the first letter of every word. Tap a word to reveal it.',
  },
  {
    id: 'flash',
    name: 'Flash',
    tagline: 'Line by line',
    icon: Icon.Flame,
    description: 'Each line glimmers briefly, then fades. Write it down from memory.',
  },
  {
    id: 'flow',
    name: 'Flow',
    tagline: 'Recite it all',
    icon: Icon.River,
    description: 'Write out the whole passage unaided. You are warned the moment you stray.',
  },
];
