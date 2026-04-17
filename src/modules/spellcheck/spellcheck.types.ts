export interface TokenCorrection {
  original: string;
  suggestion: string;
  distance: number;
  frequency: number;
  changed: boolean;
}

export interface SpellcheckResult {
  originalQuery: string;
  normalizedQuery: string;
  correctedQuery: string;
  changed: boolean;
  cached: boolean;
  suggestions: TokenCorrection[];
}