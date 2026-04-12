export function generateSnippet(
  rawContent: string,
  queryTerms: string[],
  maxLength = 180
): string {
  if (!rawContent) return '';

  const lowerContent = rawContent.toLowerCase();

  let firstMatchIndex = -1;

  for (const term of queryTerms) {
    const index = lowerContent.indexOf(term.toLowerCase());
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
    }
  }

  if (firstMatchIndex === -1) {
    const snippet = rawContent.slice(0, maxLength).trim();
    return rawContent.length > maxLength ? `${snippet}...` : snippet;
  }

  const halfWindow = Math.floor(maxLength / 2);
  const start = Math.max(0, firstMatchIndex - halfWindow);
  const end = Math.min(rawContent.length, start + maxLength);

  let snippet = rawContent.slice(start, end).trim();

  if (start > 0) snippet = `...${snippet}`;
  if (end < rawContent.length) snippet = `${snippet}...`;

  return snippet;
}