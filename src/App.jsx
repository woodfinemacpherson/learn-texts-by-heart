import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import ComposeScreen from './components/ComposeScreen';
import PracticeScreen from './components/PracticeScreen';
import { MODES } from './lib/modes';
import { PASSAGES } from './data/passages';
import { load, save } from './lib/storage';
import { cleanText, extractWords } from './lib/text';

const MODE_IDS = MODES.map((m) => m.id);

function modeFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return MODE_IDS.includes(id) ? id : null;
}

function initialPassage() {
  const saved = load('passage', null);
  if (saved && typeof saved.text === 'string') {
    return { title: saved.title ?? '', author: saved.author ?? '', text: saved.text };
  }
  const first = PASSAGES.find((p) => p.id === 'ozymandias') ?? PASSAGES[0];
  return { title: first.title, author: first.author, text: first.text };
}

export default function App() {
  const [passage, setPassage] = useState(initialPassage);
  const [mode, setMode] = useState(modeFromHash);

  useEffect(() => save('passage', passage), [passage]);

  useEffect(() => {
    const onHash = () => setMode(modeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const hasText = extractWords(passage.text).length > 0;
  const activeMode = hasText ? mode : null;

  // A practice URL with no text to practise falls back to the compose screen.
  useEffect(() => {
    if (mode && !hasText) window.history.replaceState(null, '', window.location.pathname);
  }, [mode, hasText]);

  useEffect(() => {
    const m = MODES.find((x) => x.id === activeMode);
    const name = passage.title.trim();
    document.title = m ? `${m.name}${name ? ` · ${name}` : ''} — Learn by Heart` : 'Learn by Heart';
  }, [activeMode, passage.title]);

  const openMode = useCallback((id) => {
    setPassage((p) => ({ ...p, text: cleanText(p.text) }));
    if (modeFromHash()) {
      // Switching between modes shouldn't stack history entries.
      window.history.replaceState(null, '', `#/${id}`);
      setMode(id);
    } else {
      window.location.hash = `/${id}`;
    }
    window.scrollTo({ top: 0 });
  }, []);

  const goHome = useCallback(() => {
    if (modeFromHash()) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    setMode(null);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 sm:px-6">
      <Header compact={Boolean(activeMode)} onHome={goHome} />
      <main className="flex-1">
        {activeMode ? (
          <PracticeScreen passage={passage} mode={activeMode} onModeChange={openMode} onBack={goHome} />
        ) : (
          <ComposeScreen passage={passage} onChange={setPassage} onStart={openMode} />
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-ink-faint">
        <p>
          Random poems courtesy of{' '}
          <a className="underline decoration-line-strong underline-offset-2 hover:text-accent" href="https://poetrydb.org">
            PoetryDB
          </a>
          . Your text is kept only in this browser.
        </p>
      </footer>
    </div>
  );
}
