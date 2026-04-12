export function calculateTfIdf(
  termFrequency: number,
  documentFrequency: number,
  totalDocuments: number
): number {
  if (termFrequency <= 0 || documentFrequency <= 0 || totalDocuments <= 0) {
    return 0;
  }

  const idf = Math.log((totalDocuments + 1) / (documentFrequency + 1)) + 1;
  return termFrequency * idf;
}

export function calculateTitleBoost(
  title: string,
  queryTerms: string[],
  normalizedQuery: string
): number {
  let boost = 0;
  const lowerTitle = title.toLowerCase();

  if (normalizedQuery && lowerTitle.includes(normalizedQuery)) {
    boost += 2.5;
  }

  for (const term of queryTerms) {
    if (lowerTitle.includes(term)) {
      boost += 0.75;
    }
  }

  return boost;
}