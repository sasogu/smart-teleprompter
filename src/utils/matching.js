export const tokensEqual = (a, b) => a && b && a === b;

export const tokensSoftMatch = (target, token) => {
  if (!target || !token) return false;
  if (target === token) return true;
  if (
    token.length >= 3 &&
    (target.startsWith(token) || token.startsWith(target))
  )
    return true;
  if (token.length >= 4 && (target.includes(token) || token.includes(target)))
    return true;
  return false;
};

export const normalizeWord = (input) => {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ")
    .replace(/[^a-zA-Zα-ω0-9]+/g, "")
    .trim();
};

// Re-sync when the speaker skips a whole phrase. The normal per-line search
// plus lookahead window only reach a few words ahead, so if the spoken text
// reappears further down the script it would never be found. This scans
// forward from startIndex for an exact n-gram of the latest spoken tokens
// and returns the index of its last word (-1 if not found).
// `text` must be the normalized word array; `skipWords` an optional array of
// booleans (co-host lines) to never match on. Higher n-grams are preferred;
// `minNGram` can be raised for far searches to avoid latching onto a
// repeated short phrase. `minStrongLen` (>0) requires at least one word of
// the n-gram to be at least that long, so common filler pairs like
// "and the" never trigger a jump. `endIndex` bounds the search to a given
// word index (e.g. the end of the next paragraph) to keep jumps local.
// `minExact` (>0) tolerates speech-recognition errors: the n-gram is
// accepted when at least `minExact` words match exactly and the remaining
// ones soft-match (prefix/contains). Default (null) requires an exact match
// of every word.
export const findResyncMatch = (
  text,
  tokens,
  startIndex,
  {
    skipWords = null,
    maxDistance = Infinity,
    minNGram = 2,
    minStrongLen = 0,
    endIndex = Infinity,
    minExact = null,
  } = {}
) => {
  const candidates = tokens.filter(Boolean);
  if (candidates.length < minNGram) return -1;
  const total = text.length;
  const limit = Math.min(
    total,
    endIndex === Infinity ? total : endIndex + 1,
    maxDistance === Infinity ? total : startIndex + maxDistance
  );
  const maxN = Math.min(Math.max(4, minNGram), candidates.length);
  for (let n = maxN; n >= minNGram; n--) {
    const seq = candidates.slice(-n);
    for (let i = startIndex; i + n <= limit; i++) {
      let ok = true;
      let hasStrong = minStrongLen <= 0;
      let exactCount = 0;
      for (let k = 0; k < n; k++) {
        const target = text[i + k];
        if (!target || (skipWords && skipWords[i + k])) {
          ok = false;
          break;
        }
        const exact = tokensEqual(target, seq[k]);
        if (exact) {
          exactCount++;
        } else if (minExact == null || !tokensSoftMatch(target, seq[k])) {
          ok = false;
          break;
        }
        if (minStrongLen > 0 && target.length >= minStrongLen) hasStrong = true;
      }
      if (ok && hasStrong && (minExact == null || exactCount >= minExact)) {
        return i + (n - 1);
      }
    }
  }
  return -1;
};
