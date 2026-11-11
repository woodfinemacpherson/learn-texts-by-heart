/* eslint-disable react-refresh/only-export-components -- an icon namespace object */
import { cx } from '../lib/cx';

/* ---------- Icons (24×24, stroke-based) ---------- */

function Svg({ children, className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Back: (p) => (
    <Svg {...p}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  ),
  Sun: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  ),
  Moon: (p) => (
    <Svg {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </Svg>
  ),
  Quill: (p) => (
    <Svg {...p}>
      <path d="M20 4c-7 0-12 5-13.5 12.5L5 20" />
      <path d="M20 4c0 6-4 11-11 12" />
      <path d="M9.5 11.5h5" />
    </Svg>
  ),
  Gaps: (p) => (
    <Svg {...p}>
      <path d="M3 7h5M12 7h9M3 12h9M16 12h5M3 17h3M10 17h11" />
      <path d="M8.5 5.5v3M15 10.5v3M7 15.5v3" strokeWidth="1.2" opacity=".6" />
    </Svg>
  ),
  River: (p) => (
    <Svg {...p}>
      <path d="M3 8c3-2.5 6 2.5 9 0s6 2.5 9 0" />
      <path d="M3 13c3-2.5 6 2.5 9 0s6 2.5 9 0" />
      <path d="M3 18c3-2.5 6 2.5 9 0s6 2.5 9 0" />
    </Svg>
  ),
  Flame: (p) => (
    <Svg {...p}>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.4-5.4 3.8-7.8.5 1.6 1.4 2.6 2.6 3.1C12 7.2 13.2 4.6 15.5 3c-.2 3 1.3 4.8 2.4 6.6.7 1.2 1.1 2.6 1.1 4.2 0 4.1-3 7.2-7 7.2Z" />
      <path d="M12 21c-1.7 0-2.8-1.2-2.8-2.8 0-1.9 1.6-2.9 2.8-4.7 1.2 1.8 2.8 2.8 2.8 4.7 0 1.6-1.1 2.8-2.8 2.8Z" />
    </Svg>
  ),
  Rune: (p) => (
    <Svg {...p}>
      <path d="M7 3v18M7 8l6-4M7 13l6-4" />
      <path d="M17 13v8M17 13l3 3" />
    </Svg>
  ),
  Shuffle: (p) => (
    <Svg {...p}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </Svg>
  ),
  Eye: (p) => (
    <Svg {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: (p) => (
    <Svg {...p}>
      <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Svg>
  ),
  Restart: (p) => (
    <Svg {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Svg>
  ),
  Lantern: (p) => (
    <Svg {...p}>
      <path d="M9 2h6M12 2v2M8 7h8l-1-3H9zM8 7l-1 9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l-1-9" />
      <path d="M12 10.5c-1 1.2-1.5 2-1.5 2.8a1.5 1.5 0 0 0 3 0c0-.8-.5-1.6-1.5-2.8ZM10 21h4" />
    </Svg>
  ),
  Book: (p) => (
    <Svg {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5Z" />
      <path d="M4 20a2 2 0 0 0 2 2h13v-4M8 7h7M8 11h5" />
    </Svg>
  ),
  Dice: (p) => (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Svg>
  ),
  Trash: (p) => (
    <Svg {...p}>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </Svg>
  ),
  Skip: (p) => (
    <Svg {...p}>
      <path d="M5 5l9 7-9 7zM19 5v14" />
    </Svg>
  ),
  Check: (p) => (
    <Svg {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  ),
  Chevron: (p) => (
    <Svg {...p}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  ),
  Spinner: ({ className }) => (
    <svg viewBox="0 0 24 24" className={cx('animate-spin', className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

