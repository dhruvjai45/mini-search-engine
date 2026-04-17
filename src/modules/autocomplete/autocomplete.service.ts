import { pool } from '../../config/postgres';
import { normalizeText } from '../../common/utils/normalizeText';
import { CACHE_CONFIG, cacheKeys } from '../cache/cacheKeys';
import { cacheService } from '../cache/cache.service';
import { AutocompleteTrie } from './trie';
import type { AutocompleteResponse, AutocompleteSuggestion } from './autocomplete.types';

type TitleRow = {
  title: string;
};

type TermRow = {
  term: string;
};

type QueryRow = {
  suggestion: string;
  frequency: string;
};

class AutocompleteService {
  private trie = new AutocompleteTrie();
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.loadFromDatabase();
    return this.initPromise;
  }

  private async loadFromDatabase(): Promise<void> {
    const [titlesResult, termsResult, queriesResult] = await Promise.all([
      pool.query<TitleRow>(
        `
        SELECT title
        FROM documents
        WHERE title IS NOT NULL AND title <> ''
        `
      ),
      pool.query<TermRow>(
        `
        SELECT DISTINCT term
        FROM document_terms
        WHERE term IS NOT NULL AND term <> ''
        `
      ),
      pool.query<QueryRow>(
        `
        SELECT
          COALESCE(NULLIF(normalized_query, ''), query_text) AS suggestion,
          COUNT(*)::text AS frequency
        FROM query_logs
        GROUP BY COALESCE(NULLIF(normalized_query, ''), query_text)
        ORDER BY COUNT(*) DESC
        LIMIT 1000
        `
      )
    ]);

    for (const row of titlesResult.rows) {
      this.addSuggestion(row.title, 3);
    }

    for (const row of termsResult.rows) {
      this.addSuggestion(row.term, 1);
    }

    for (const row of queriesResult.rows) {
      this.addSuggestion(row.suggestion, Number(row.frequency) || 1);
    }
  }

  addSuggestion(text: string, weight = 1): void {
    const normalized = normalizeText(text);
    if (!normalized) return;

    this.trie.insert(normalized, weight);
  }

  getSuggestions(prefix: string, limit = 10): AutocompleteResponse {
    const normalized = normalizeText(prefix);
    const cacheKey = cacheKeys.suggest(normalized, limit);

    const cached = cacheService.get<Omit<AutocompleteResponse, 'cached'>>(cacheKey);
    if (cached) {
      return {
        ...cached,
        query: normalized,
        limit,
        cached: true
      };
    }

    const suggestions = this.trie.getSuggestions(normalized, limit);

    const response: Omit<AutocompleteResponse, 'cached'> = {
      query: normalized,
      limit,
      suggestions
    };

    cacheService.set(cacheKey, response, CACHE_CONFIG.SUGGEST_TTL_MS);

    return {
      ...response,
      cached: false
    };
  }
}

export const autocompleteService = new AutocompleteService();