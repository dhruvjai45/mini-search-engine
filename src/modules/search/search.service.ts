import { ValidationError } from '../../common/errors/AppError';
import { generateSnippet } from '../../common/utils/snippet';
import { tokenize } from '../../common/utils/tokenize';
import { CACHE_CONFIG, cacheKeys } from '../cache/cacheKeys';
import { cacheService } from '../cache/cache.service';
import { spellcheckService } from '../spellcheck/spellcheck.service';
import {
  findSearchTermMatches,
  countTotalMatches,
  logSearchQuery
} from './search.repository';
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem
} from './search.types';

export async function searchDocuments(
  input: SearchRequest
): Promise<SearchResponse> {
  const startedAt = Date.now();

  // 🔹 Tokenize
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
  const cacheKey = cacheKeys.search(normalizedQuery, input.page, input.limit);

  // 🔹 Cache check
  const cached = cacheService.get<Omit<SearchResponse, 'tookMs'>>(cacheKey);
  if (cached) {
    const tookMs = Date.now() - startedAt;

    await logSearchQuery({
      queryText: input.q,
      normalizedQuery: cached.normalizedQuery,
      resultCount: cached.totalResults,
      latencyMs: tookMs
    });

    return {
      ...cached,
      tookMs,
      cached: true
    };
  }

  // 🔹 Strict match first
const exactThreshold = queryTerms.length > 1 ? queryTerms.length : 1;
let usedThreshold = exactThreshold;

let matches = await findSearchTermMatches(
  queryTerms,
  exactThreshold,
  input.page * input.limit,
  normalizedQuery
);

  let didYouMean: string | null = null;
  let correctionApplied = false;

  // 🔹 SPELLCHECK FALLBACK
  if (matches.length === 0) {
    const correction = spellcheckService.suggestQuery(input.q, 5);

    if (correction.changed && correction.correctedQuery !== normalizedQuery) {
      const correctedTerms = tokenize(correction.correctedQuery, {
        removeStopWords: true,
        minLength: 2
      });

      if (correctedTerms.length > 0) {
        const correctedThreshold =
          correctedTerms.length > 1 ? correctedTerms.length : 1;

        const correctedMatches = await findSearchTermMatches(
          correctedTerms,
          correctedThreshold,
          input.page * input.limit,
          correction.correctedQuery
        );

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

  // 🔥 🔥 🔥 CRITICAL FIX — PARTIAL MATCH FALLBACK (RECALL FIX)
if (matches.length === 0 && queryTerms.length > 1) {
  usedThreshold = 1;

  matches = await findSearchTermMatches(
    queryTerms,
    1,
    input.page * input.limit,
    normalizedQuery
  );
}

  // 🔹 Total count (based on strict logic)
const totalResults = await countTotalMatches(
  queryTerms,
  usedThreshold
);

  const pageStart = (input.page - 1) * input.limit;

  const paginated = matches.slice(
    pageStart,
    pageStart + input.limit
  );

  const results: SearchResultItem[] = paginated.map((doc) => ({
    id: doc.document_id,
    title: doc.title,
    url: doc.url,
    sourceType: doc.source_type,
    score: Number(doc.bm25_score),
    matchedTerms: queryTerms,
    snippet: generateSnippet(doc.raw_content, queryTerms),
    createdAt: doc.created_at
  }));

  const tookMs = Date.now() - startedAt;

  const response: SearchResponse = {
    query: input.q,
    normalizedQuery,
    didYouMean,
    correctionApplied,
    cached: false,
    page: input.page,
    limit: input.limit,
    totalResults,
    returnedResults: results.length,
    tookMs,
    results
  };

  // 🔹 Logging
  await logSearchQuery({
    queryText: input.q,
    normalizedQuery,
    resultCount: totalResults,
    latencyMs: tookMs
  });

  // 🔹 Cache
  const { tookMs: _ignored, ...cacheable } = response;
  cacheService.set(cacheKey, cacheable, CACHE_CONFIG.SEARCH_TTL_MS);

  return response;
}