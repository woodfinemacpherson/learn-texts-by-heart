import { useId } from 'react';
import { cx } from '../lib/cx';
import { Icon } from './icons';

const VARIANTS = {
  primary:
    'bg-accent text-accent-ink border-accent shadow-sm hover:bg-accent-hover hover:border-accent-hover active:translate-y-px',
  secondary:
    'bg-surface text-ink border-line-strong hover:bg-surface-2 hover:border-accent active:translate-y-px',
  ghost: 'bg-transparent text-ink-soft border-transparent hover:bg-surface-2 hover:text-ink',
  danger: 'bg-transparent text-bad border-transparent hover:bg-bad-soft',
};

const SIZES = {
  sm: 'h-9 px-3 text-[0.8rem] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({ variant = 'secondary', size = 'md', className, icon: Icon, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg border font-heading font-semibold tracking-wide whitespace-nowrap',
        'transition-[background-color,border-color,color,transform] duration-150 select-none',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={cx('shrink-0', size === 'sm' ? 'size-4' : 'size-[1.1rem]')} />}
      {children}
    </button>
  );
}

/** A segmented control (radio group styled as tabs). */
export function Segmented({ label, options, value, onChange, className, size = 'md', narrowIcons = true }) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('inline-flex rounded-lg border border-line bg-surface-2 p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <label
            key={opt.value}
            className={cx(
              'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md font-heading font-semibold tracking-wide whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-[0.8rem]',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
              active ? 'bg-surface text-accent shadow-sm ring-1 ring-line' : 'text-ink-soft hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {Icon && <Icon className={cx('size-4 shrink-0', !narrowIcons && 'max-[420px]:hidden')} />}
            <span className={opt.hideLabelOnMobile ? 'max-sm:sr-only' : undefined}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, label, className }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cx('h-2 overflow-hidden rounded-full bg-page-deep ring-1 ring-line ring-inset', className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-gold transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** A filigree divider: hairlines either side of a small eight-pointed star. */
export function Ornament({ className }) {
  return (
    <div className={cx('flex items-center gap-3 text-gold', className)} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-line-strong to-line-strong" />
      <svg viewBox="0 0 40 16" className="h-4 w-10" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 8h11M29 8h11" />
        <circle cx="11.5" cy="8" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="28.5" cy="8" r="1.4" fill="currentColor" stroke="none" />
        <path d="M20 1.5 22 6l4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="currentColor" stroke="none" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-line-strong to-line-strong" />
    </div>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="rounded border border-line bg-surface-2 px-1.5 py-px font-sans text-[0.8em] text-ink-soft shadow-[0_1px_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

/** Stat used on completion cards. */
export function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center px-3">
      <span className="font-heading text-2xl font-bold text-accent tabular-nums">{value}</span>
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  );
}

/** Celebration panel shown when a trial is completed. */
export function Victory({ title, children, stats, actions }) {
  return (
    <div
      role="status"
      className="animate-rise rounded-xl border border-gold/60 bg-gradient-to-b from-gold-soft/45 to-surface p-5 text-center sm:p-6"
    >
      <Laurel className="mx-auto mb-1 h-9 w-24 text-gold" />
      <h3 className="font-heading text-xl font-bold text-accent sm:text-2xl">{title}</h3>
      {children && <p className="mx-auto mt-1 max-w-prose text-ink-soft">{children}</p>}
      {stats && <div className="mt-4 flex flex-wrap justify-center gap-y-3 divide-x divide-line">{stats}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Laurel({ className }) {
  return (
    <svg viewBox="0 0 96 36" className={className} fill="currentColor" aria-hidden="true">
      <path d="M48 31c-9-1-18-6-24-14 4 0 7 1 9 3-3-4-4-8-4-13 4 3 6 7 6 11 1-3 3-6 6-7-1 5-1 9 1 13 2 3 4 5 6 7Z" opacity=".9" />
      <path d="M48 31c9-1 18-6 24-14-4 0-7 1-9 3 3-4 4-8 4-13-4 3-6 7-6 11-1-3-3-6-6-7 1 5 1 9-1 13-2 3-4 5-6 7Z" opacity=".9" />
      <circle cx="48" cy="5" r="2.5" />
    </svg>
  );
}

