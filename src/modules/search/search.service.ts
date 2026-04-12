import { ValidationError } from '../../common/errors/AppError';
import { generateSnippet } from '../../common/utils/snippet';
import { tokenize } from '../../common/utils/tokenize';
import { findSearchCandidates, logSearchQuery } from './search.repository';
import type { SearchRequest, SearchResponse, SearchResultItem } from './search.types';

function normalizeQueryText(query: string): string {
  return tokenize(query, { removeStopWords: true }).join(' ');
}

function computeFinalScore(
  baseScore: number,
  title: string,
  rawContent: string,
  normalizedQuery: string,
  queryTerms: string[]
): number {
  let score = baseScore;

  const normalizedTitle = title.toLowerCase();
  const normalizedContent = rawContent.toLowerCase();

  if (normalizedTitle.includes(normalizedQuery)) {
    score += 5;
  }

  for (const term of queryTerms) {
    if (normalizedTitle.includes(term)) {
      score += 1.5;
    }
    if (normalizedContent.includes(term)) {
      score += 0.5;
    }
  }

  return score;
}

export async function searchDocuments(
  input: SearchRequest
): Promise<SearchResponse> {
  const startedAt = Date.now();

  const normalizedTokens = tokenize(input.q, {
    removeStopWords: true,
    minLength: 2
  });

  if (normalizedTokens.length === 0) {
    throw new ValidationError('Search query must contain at least one meaningful term');
  }

  const normalizedQuery = normalizedTokens.join(' ');
  const candidates = await findSearchCandidates(normalizedTokens);

  const scoredResults: SearchResultItem[] = candidates.map((candidate) => {
    const baseScore = Number(candidate.base_score) || 0;
    const finalScore = computeFinalScore(
      baseScore,
      candidate.title,
      candidate.raw_content,
      normalizedQuery,
      normalizedTokens
    );

    return {
      id: candidate.id,
      title: candidate.title,
      url: candidate.url,
      sourceType: candidate.source_type,
      score: Number(finalScore.toFixed(3)),
      matchedTerms: candidate.matched_terms ?? [],
      snippet: generateSnippet(candidate.raw_content, normalizedTokens),
      createdAt: candidate.created_at
    };
  });

scoredResults.sort((a, b) => {
  if (b.matchedTerms.length !== a.matchedTerms.length) {
    return b.matchedTerms.length - a.matchedTerms.length;
  }

  if (b.score !== a.score) return b.score - a.score;

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
    page: input.page,
    limit: input.limit,
    totalResults,
    returnedResults: paginated.length,
    tookMs,
    results: paginated
  };
}