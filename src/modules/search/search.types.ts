export interface SearchRequest {
  q: string;
  page: number;
  limit: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string | null;
  sourceType: 'manual' | 'crawl';
  score: number;
  matchedTerms: string[];
  snippet: string;
  createdAt: Date;
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  didYouMean: string | null;
  correctionApplied: boolean;
  page: number;
  limit: number;
  totalResults: number;
  returnedResults: number;
  tookMs: number;
  results: SearchResultItem[];
}