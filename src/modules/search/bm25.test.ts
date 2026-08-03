import { calculateBm25, calculateTitleBoost, calculatePhraseBoost } from './bm25';

describe('calculateBm25', () => {
  const baseParams = {
    termFrequency: 3, documentFrequency: 10, totalDocuments: 1000,
    documentLength: 200, averageDocumentLength: 150,
  };

  it('returns a positive score for valid input', () => {
    expect(calculateBm25(baseParams)).toBeGreaterThan(0);
  });

  it('gives a higher score to a document with higher term frequency', () => {
    const low = calculateBm25({ ...baseParams, termFrequency: 1 });
    const high = calculateBm25({ ...baseParams, termFrequency: 8 });
    expect(high).toBeGreaterThan(low);
  });

  it('gives a lower score to more common terms (higher documentFrequency)', () => {
    const rare = calculateBm25({ ...baseParams, documentFrequency: 2 });
    const common = calculateBm25({ ...baseParams, documentFrequency: 500 });
    expect(rare).toBeGreaterThan(common);
  });

  it('returns 0 when any required input is zero or negative', () => {
    expect(calculateBm25({ ...baseParams, termFrequency: 0 })).toBe(0);
    expect(calculateBm25({ ...baseParams, documentFrequency: 0 })).toBe(0);
  });
});

describe('calculateTitleBoost', () => {
  it('adds a strong boost for an exact phrase match in the title', () => {
    const boost = calculateTitleBoost('Node.js Search Engine', ['search', 'engine'], 'search engine');
    expect(boost).toBeCloseTo(3 + 0.9 + 0.9);
  });

  it('returns 0 when nothing matches', () => {
    expect(calculateTitleBoost('Unrelated title', ['xyz'], 'xyz')).toBe(0);
  });
});

describe('calculatePhraseBoost', () => {
  it('returns 2.5 when the normalized query appears verbatim in content', () => {
    expect(calculatePhraseBoost('a fast search engine for developers', 'search engine')).toBe(2.5);
  });

  it('returns 0 when the phrase is not present', () => {
    expect(calculatePhraseBoost('a fast indexing tool', 'search engine')).toBe(0);
  });
});