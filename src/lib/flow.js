import { extractWords, normalizeWord } from './text';

/**
 * Check free-recall input against the expected words.
 *
 * The final word is treated as "in progress" while the learner is still typing
 * it (no space or punctuation after it yet), so it only has to be a prefix of
 * the expected word. Returns:
 *   matched     – number of expected words correctly recited so far
 *   error       – true if the input has strayed from the text
 *   errorIndex  – index of the expected word where it strayed (or null)
 *   complete    – the whole passage has been recited
 */
export function checkRecital(expectedWords, input) {
  const typed = extractWords(input);
  const lastInProgress = /[\p{L}\p{M}\p{N}'’ʼ‘-]$/u.test(input);
  let matched = 0;

  for (let i = 0; i < typed.length; i++) {
    const got = normalizeWord(typed[i]);
    if (i >= expectedWords.length) {
      return { matched, error: true, errorIndex: i, extra: true, complete: false };
    }
    const want = normalizeWord(expectedWords[i]);
    const isLast = i === typed.length - 1;
    if (got === want) {
      matched++;
    } else if (isLast && lastInProgress && want.startsWith(got)) {
      break;
    } else {
      return { matched, error: true, errorIndex: i, extra: false, complete: false };
    }
  }

  return {
    matched,
    error: false,
    errorIndex: null,
    extra: false,
    complete: expectedWords.length > 0 && matched === expectedWords.length,
  };
}
