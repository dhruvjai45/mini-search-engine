export interface AutocompleteSuggestion {
  text: string;
  frequency: number;
}

export interface AutocompleteResponse {
  query: string;
  limit: number;
  cached: boolean;
  suggestions: AutocompleteSuggestion[];
}