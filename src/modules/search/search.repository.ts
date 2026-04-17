import { pool } from '../../config/postgres';

export type SearchMatchRow = {
  document_id: string;
  title: string;
  url: string | null;
  raw_content: string;
  source_type: 'manual' | 'crawl';
  created_at: Date;
  document_length: number;
  matched_term_count: number;
  bm25_score: number;
};

const SQL_QUERY = `
WITH candidate_docs AS (
  SELECT
    dt.document_id,
    COUNT(DISTINCT dt.term)::int AS matched_term_count
  FROM document_terms dt
  WHERE dt.term = ANY($1::text[])
  GROUP BY dt.document_id
  HAVING COUNT(DISTINCT dt.term) >= $2::int
  ORDER BY matched_term_count DESC
  LIMIT 100
),
corpus AS (
  SELECT total_documents, average_document_length
  FROM corpus_stats
  WHERE id = 1
),
term_stats_lookup AS (
  SELECT term, document_frequency
  FROM term_stats
  WHERE term = ANY($1::text[])
),
bm25_scores AS (
  SELECT
    d.id AS document_id,
    d.title,
    d.url,
    d.raw_content,
    d.source_type,
    d.created_at,
    d.document_length,
    cd.matched_term_count,

    (
      SUM(
        (
          LOG(
            (c.total_documents - tsl.document_frequency + 0.5) /
            (tsl.document_frequency + 0.5)
          )
        )
        *
        (
          (dt.term_frequency * 2.5) /
          (
            dt.term_frequency +
            1.5 * (
              1 - 0.75 +
              0.75 * d.document_length / c.average_document_length
            )
          )
        )
      )

      -- TITLE BOOST
      + CASE 
          WHEN LOWER(d.title) LIKE '%' || $4 || '%' THEN 5.0
          ELSE 0
        END

      -- TERM MATCH BOOST (title contains terms)
      + (
        SELECT COUNT(*) * 0.7
        FROM unnest($1::text[]) t
        WHERE LOWER(d.title) LIKE '%' || t || '%'
      )

      -- CONTENT PHRASE BOOST
      + CASE
          WHEN LOWER(d.raw_content) LIKE '%' || $4 || '%' THEN 1.0
          ELSE 0
        END

      -- FRESHNESS BOOST
      + (1 / (1 + EXTRACT(EPOCH FROM NOW() - d.created_at) / 86400)) * 0.8

      -- LENGTH PENALTY
      - (d.document_length * 0.00005)

    )::float AS bm25_score

  FROM candidate_docs cd
  JOIN document_terms dt
    ON dt.document_id = cd.document_id
   AND dt.term = ANY($1::text[])
  JOIN term_stats_lookup tsl
    ON tsl.term = dt.term
  JOIN documents d
    ON d.id = dt.document_id
  CROSS JOIN corpus c

  GROUP BY
    d.id,
    d.title,
    d.url,
    d.raw_content,
    d.source_type,
    d.created_at,
    d.document_length,
    cd.matched_term_count
)

SELECT *
FROM bm25_scores
ORDER BY bm25_score DESC, matched_term_count DESC, created_at DESC
LIMIT $3;
`;

export async function findSearchTermMatches(
  queryTerms: string[],
  minMatchedTerms: number,
  limit: number,
  normalizedQuery: string
): Promise<SearchMatchRow[]> {
  if (queryTerms.length === 0) return [];

  const result = await pool.query<SearchMatchRow>(
    SQL_QUERY,
    [queryTerms, minMatchedTerms, limit, normalizedQuery]
  );

  return result.rows;
}

export async function countTotalMatches(
  queryTerms: string[],
  minMatchedTerms: number
): Promise<number> {
  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT dt.document_id
      FROM document_terms dt
      WHERE dt.term = ANY($1::text[])
      GROUP BY dt.document_id
      HAVING COUNT(DISTINCT dt.term) >= $2::int
    ) t
    `,
    [queryTerms, minMatchedTerms]
  );

  return result.rows[0]?.count ?? 0;
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
    VALUES ($1::text, $2::text, $3::int, $4::int)
    `,
    [
      params.queryText,
      params.normalizedQuery,
      params.resultCount,
      params.latencyMs
    ]
  );
}