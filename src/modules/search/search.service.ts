import { ValidationError } from '../../common/errors/AppError';
import { generateSnippet } from '../../common/utils/snippet';
import { tokenize } from '../../common/utils/tokenize';
import {
  calculateBm25,
  calculatePhraseBoost,
  calculateTitleBoost
} from './bm25';
import { findSearchTermMatches, logSearchQuery } from './search.repository';
import { spellcheckService } from '../spellcheck/spellcheck.service';
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem
} from './search.types';

type AggregatedResult = {
  id: string;
  title: string;
  url: string | null;
  sourceType: 'manual' | 'crawl';
  rawContent: string;
  createdAt: Date;
  matchedTerms: Set<string>;
  score: number;
};

export async function searchDocuments(
  input: SearchRequest
): Promise<SearchResponse> {
  const startedAt = Date.now();

  let queryTerms = Array.from(
    new Set(
      tokenize(input.q, {
        removeStopWords: true,
        minLength: 2
      })
    )
  );

  if (queryTerms.length === 0) {
    throw new ValidationError(
      'Search query must contain at least one meaningful term'
    );
  }

  let normalizedQuery = queryTerms.join(' ');
  let matches = await findSearchTermMatches(queryTerms);

  let didYouMean: string | null = null;
  let correctionApplied = false;

  if (matches.length === 0) {
    const correction = spellcheckService.suggestQuery(input.q);

    if (correction.changed && correction.correctedQuery !== normalizedQuery) {
      const correctedTerms = tokenize(correction.correctedQuery, {
        removeStopWords: true,
        minLength: 2
      });

      if (correctedTerms.length > 0) {
        const correctedMatches = await findSearchTermMatches(correctedTerms);

        didYouMean = correction.correctedQuery;

        if (correctedMatches.length > 0) {
          matches = correctedMatches;
          queryTerms = correctedTerms;
          normalizedQuery = correction.correctedQuery;
          correctionApplied = true;
        }
      }
    }
  }

  const aggregated = new Map<string, AggregatedResult>();

  for (const row of matches) {
    const existing =
      aggregated.get(row.document_id) ??
      {
        id: row.document_id,
        title: row.title,
        url: row.url,
        sourceType: row.source_type,
        rawContent: row.raw_content,
        createdAt: row.created_at,
        matchedTerms: new Set<string>(),
        score: 0
      };

    const bm25Score = calculateBm25({
      termFrequency: row.term_frequency,
      documentFrequency: row.document_frequency,
      totalDocuments: row.total_documents,
      documentLength: row.document_length,
      averageDocumentLength: Number(row.average_document_length)
    });

    existing.score += bm25Score;
    existing.matchedTerms.add(row.term);
    aggregated.set(row.document_id, existing);
  }

  const scoredResults: SearchResultItem[] = Array.from(aggregated.values()).map(
    (doc) => {
      const titleBoost = calculateTitleBoost(
        doc.title,
        queryTerms,
        normalizedQuery
      );

      const phraseBoost = calculatePhraseBoost(doc.rawContent, normalizedQuery);

      const finalScore = doc.score + titleBoost + phraseBoost;

      return {
        id: doc.id,
        title: doc.title,
        url: doc.url,
        sourceType: doc.sourceType,
        score: Number(finalScore.toFixed(4)),
        matchedTerms: Array.from(doc.matchedTerms),
        snippet: generateSnippet(doc.rawContent, queryTerms),
        createdAt: doc.createdAt
      };
    }
  );

  scoredResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedTerms.length !== a.matchedTerms.length) {
      return b.matchedTerms.length - a.matchedTerms.length;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const totalResults = scoredResults.length;
  const offset = (input.page - 1) * input.limit;
  const paginated = scoredResults.slice(offset, offset + input.limit);
  const tookMs = Date.now() - startedAt;

  await logSearchQuery({
    queryText: input.q,
    normalizedQuery,
    resultCount: totalResults,
    latencyMs: tookMs
  });

  return {
    query: input.q,
    normalizedQuery,
    didYouMean,
    correctionApplied,
    page: input.page,
    limit: input.limit,
    totalResults,
    returnedResults: paginated.length,
    tookMs,
    results: paginated
  };
}