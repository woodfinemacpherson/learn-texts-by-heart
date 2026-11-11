import { useCallback, useState } from 'react';
import { load, save } from './storage';

/** useState that persists to localStorage under `settings.<key>`. */
export function useSetting(key, fallback) {
  const [value, setValue] = useState(() => load(`settings.${key}`, fallback));
  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        save(`settings.${key}`, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, update];
}
