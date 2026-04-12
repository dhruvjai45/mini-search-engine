export interface Bm25Params {
  termFrequency: number;
  documentFrequency: number;
  totalDocuments: number;
  documentLength: number;
  averageDocumentLength: number;
  k1?: number;
  b?: number;
}

export function calculateBm25({
  termFrequency,
  documentFrequency,
  totalDocuments,
  documentLength,
  averageDocumentLength,
  k1 = 1.5,
  b = 0.75
}: Bm25Params): number {
  if (
    termFrequency <= 0 ||
    documentFrequency <= 0 ||
    totalDocuments <= 0 ||
    documentLength <= 0 ||
    averageDocumentLength <= 0
  ) {
    return 0;
  }

  const idf = Math.log(
    1 + (totalDocuments - documentFrequency + 0.5) / (documentFrequency + 0.5)
  );

  const denominator =
    termFrequency + k1 * (1 - b + b * (documentLength / averageDocumentLength));

  return idf * ((termFrequency * (k1 + 1)) / denominator);
}

export function calculateTitleBoost(
  title: string,
  queryTerms: string[],
  normalizedQuery: string
): number {
  let boost = 0;
  const lowerTitle = title.toLowerCase();

  if (normalizedQuery && lowerTitle.includes(normalizedQuery)) {
    boost += 3;
  }

  for (const term of queryTerms) {
    if (lowerTitle.includes(term)) {
      boost += 0.9;
    }
  }

  return boost;
}

export function calculatePhraseBoost(
  rawContent: string,
  normalizedQuery: string
): number {
  if (!normalizedQuery) return 0;

  const content = rawContent.toLowerCase();
  const query = normalizedQuery.toLowerCase();

  if (content.includes(query)) {
    return 2.5;
  }

  return 0;
}