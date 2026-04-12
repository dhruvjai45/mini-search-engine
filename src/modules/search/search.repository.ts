import { pool } from '../../config/postgres';

export type SearchMatchRow = {
  document_id: string;
  title: string;
  url: string | null;
  raw_content: string;
  source_type: 'manual' | 'crawl';
  created_at: Date;
  term: string;
  term_frequency: number;
  document_frequency: number;
  total_documents: number;
};

export async function findSearchTermMatches(
  queryTerms: string[]
): Promise<SearchMatchRow[]> {
  if (queryTerms.length === 0) return [];

  const result = await pool.query<SearchMatchRow>(
    `
    WITH total_docs AS (
      SELECT COUNT(*)::int AS total_documents
      FROM documents
    ),
    term_doc_freq AS (
      SELECT
        term,
        COUNT(DISTINCT document_id)::int AS document_frequency
      FROM document_terms
      WHERE term = ANY($1::text[])
      GROUP BY term
    )
    SELECT
      d.id AS document_id,
      d.title,
      d.url,
      d.raw_content,
      d.source_type,
      d.created_at,
      dt.term,
      dt.term_frequency,
      tdf.document_frequency,
      td.total_documents
    FROM document_terms dt
    JOIN term_doc_freq tdf
      ON tdf.term = dt.term
    JOIN documents d
      ON d.id = dt.document_id
    CROSS JOIN total_docs td
    WHERE dt.term = ANY($1::text[])
    ORDER BY d.id ASC, dt.term ASC
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