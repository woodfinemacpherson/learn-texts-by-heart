// localStorage can throw (private mode, quota, disabled cookies). Never let
// that break the app: fall back silently to in-memory defaults.

const PREFIX = 'learn-by-heart:';

export function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
