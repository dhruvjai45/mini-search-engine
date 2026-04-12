import { pool } from '../../config/postgres';

type SearchCandidateRow = {
  id: string;
  title: string;
  url: string | null;
  raw_content: string;
  source_type: 'manual' | 'crawl';
  created_at: Date;
  base_score: string | number;
  matched_terms: string[];
  matched_term_count: number;
};

export async function findSearchCandidates(queryTerms: string[]) {
    if (queryTerms.length === 0) return [];

    const result = await pool.query<SearchCandidateRow>(
        `
    WITH term_matches AS (
  SELECT
    dt.document_id,
    dt.term,
    dt.term_frequency
  FROM document_terms dt
  WHERE dt.term = ANY($1::text[])
),
aggregated AS (
  SELECT
    document_id,
    COUNT(DISTINCT term) AS matched_term_count,
    SUM(term_frequency) AS base_score,
    ARRAY_AGG(DISTINCT term) AS matched_terms
  FROM term_matches
  GROUP BY document_id
)
SELECT
  d.id,
  d.title,
  d.url,
  d.raw_content,
  d.source_type,
  d.created_at,
  a.base_score,
  a.matched_terms,
  a.matched_term_count
FROM aggregated a
JOIN documents d ON d.id = a.document_id
ORDER BY
  a.matched_term_count DESC,
  a.base_score DESC,
  d.created_at DESC;
    `,
        [queryTerms]
    );

    return result.rows;
}

export async function logSearchQuery(params: {
    queryText: string;
    normalizedQuery: string;
    resultCount: number;
    latencyMs: number;
}): Promise<void> {
    await pool.query(
        `
    INSERT INTO query_logs (
      query_text,
      normalized_query,
      result_count,
      latency_ms
    )
    VALUES ($1, $2, $3, $4)
    `,
        [
            params.queryText,
            params.normalizedQuery,
            params.resultCount,
            params.latencyMs
        ]
    );
}