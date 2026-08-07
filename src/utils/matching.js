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
