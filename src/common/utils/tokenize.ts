const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else',
  'when', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'once', 'here', 'there', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'now',"is", "are", "was", "were", "be", "been", "being", "that", "this", "these", "those"
]);

type TokenizeOptions = {
  removeStopWords?: boolean;
  minLength?: number;
};

export function tokenize(
  input: string,
  options: TokenizeOptions = {}
): string[] {
  const {
    removeStopWords = true,
    minLength = 2
  } = options;

  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= minLength)
    .filter((token) => !removeStopWords || !STOP_WORDS.has(token));
}