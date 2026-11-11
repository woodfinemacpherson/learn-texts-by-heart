import { useEffect, useState } from 'react';
import { Ornament } from './ui';
import { Icon } from './icons';
import { cx } from '../lib/cx';
import { load, save } from '../lib/storage';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function Header({ compact, onHome }) {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#12130f' : '#efe3c8');
  }, [theme]);

  // Follow the system theme until the user picks one explicitly.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e) => {
      if (!load('theme', null)) setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    save('theme', next);
    setTheme(next);
  };

  return (
    <header className={cx('relative text-center', compact ? 'pt-5 pb-4' : 'pt-10 pb-7 sm:pt-14 sm:pb-9')}>
      <button
        type="button"
        onClick={toggle}
        className="absolute top-3 right-0 grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-accent sm:top-4"
        aria-label={theme === 'dark' ? 'Switch to day theme' : 'Switch to night theme'}
        title={theme === 'dark' ? 'Day' : 'Night'}
      >
        {theme === 'dark' ? <Icon.Sun className="size-5" /> : <Icon.Moon className="size-5" />}
      </button>

      <h1 className={cx('font-display font-bold tracking-wide text-accent', compact ? 'text-2xl sm:text-3xl' : 'text-[2.05rem] min-[400px]:text-4xl sm:text-5xl')}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          className="rounded-md px-2 [text-shadow:0_1px_0_var(--color-surface)]"
        >
          Learn by Heart
        </a>
      </h1>
      {!compact && (
        <p className="mt-2 font-heading text-sm tracking-[0.2em] text-ink-soft uppercase sm:text-[0.95rem]">
          Poems &amp; passages, kept for ever
        </p>
      )}
      <Ornament className={cx('mx-auto max-w-sm', compact ? 'mt-3' : 'mt-5')} />
    </header>
  );
}
