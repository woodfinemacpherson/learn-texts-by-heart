const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Briefly shake an element to signal a mistake. */
export function shake(el) {
  if (!el?.animate || reduceMotion()) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 320, easing: 'ease-in-out' },
  );
}
