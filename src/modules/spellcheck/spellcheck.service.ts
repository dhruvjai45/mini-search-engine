import { pool } from '../../config/postgres';
import { normalizeText } from '../../common/utils/normalizeText';
import { tokenize } from '../../common/utils/tokenize';
import { levenshteinDistance } from '../../common/utils/levenshtein';
import type { SpellcheckResult, TokenCorrection } from './spellcheck.types';

type DictionaryRow = {
  term: string;
  frequency: string;
};

class SpellcheckService {
  private dictionary = new Map<string, number>();
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.loadFromDatabase();
    return this.initPromise;
  }

  private async loadFromDatabase(): Promise<void> {
    const result = await pool.query<DictionaryRow>(
      `
      SELECT
        term,
        SUM(term_frequency)::text AS frequency
      FROM document_terms
      GROUP BY term
      ORDER BY SUM(term_frequency) DESC
      `
    );

    for (const row of result.rows) {
      this.dictionary.set(row.term.toLowerCase(), Number(row.frequency) || 1);
    }
  }

  addTerms(terms: string[], weight = 1): void {
    for (const term of terms) {
      const normalized = normalizeText(term);
      if (!normalized) continue;

      const tokens = tokenize(normalized, { removeStopWords: true, minLength: 2 });
      for (const token of tokens) {
        this.dictionary.set(
          token,
          (this.dictionary.get(token) ?? 0) + weight
        );
      }
    }
  }

  suggestToken(token: string): TokenCorrection {
    const original = token.toLowerCase().trim();

    if (!original) {
      return {
        original,
        suggestion: original,
        distance: 0,
        frequency: 0,
        changed: false
      };
    }

    const exactFrequency = this.dictionary.get(original);
    if (exactFrequency !== undefined) {
      return {
        original,
        suggestion: original,
        distance: 0,
        frequency: exactFrequency,
        changed: false
      };
    }

    const firstChar = original[0];
    const maxDistance = original.length <= 4 ? 1 : 2;

    let bestTerm = original;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestFrequency = 0;

    for (const [term, frequency] of this.dictionary.entries()) {
      if (term[0] !== firstChar) continue;
      if (Math.abs(term.length - original.length) > 2) continue;

      const distance = levenshteinDistance(original, term);
      if (distance > maxDistance) continue;

      const isBetter =
        distance < bestDistance ||
        (distance === bestDistance && frequency > bestFrequency) ||
        (distance === bestDistance &&
          frequency === bestFrequency &&
          term.length < bestTerm.length) ||
        (distance === bestDistance &&
          frequency === bestFrequency &&
          term.length === bestTerm.length &&
          term.localeCompare(bestTerm) < 0);

      if (isBetter) {
        bestTerm = term;
        bestDistance = distance;
        bestFrequency = frequency;
      }
    }

    if (bestTerm === original) {
      return {
        original,
        suggestion: original,
        distance: 0,
        frequency: 0,
        changed: false
      };
    }

    return {
      original,
      suggestion: bestTerm,
      distance: bestDistance,
      frequency: bestFrequency,
      changed: true
    };
  }

  suggestQuery(query: string): SpellcheckResult {
    const normalizedTokens = tokenize(query, {
      removeStopWords: true,
      minLength: 2
    });

    const suggestions = normalizedTokens.map((token) => this.suggestToken(token));
    const correctedQuery = suggestions.map((item) => item.suggestion).join(' ');
    const normalizedQuery = normalizedTokens.join(' ');

    return {
      originalQuery: query,
      normalizedQuery,
      correctedQuery,
      changed: correctedQuery !== normalizedQuery,
      suggestions
    };
  }
}

export const spellcheckService = new SpellcheckService();