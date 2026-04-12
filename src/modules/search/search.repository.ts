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
  document_length: number;
  average_document_length: number;
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
    doc_lengths AS (
      SELECT
        document_id,
        SUM(term_frequency)::int AS document_length
      FROM document_terms
      GROUP BY document_id
    ),
    avg_length AS (
      SELECT COALESCE(AVG(document_length), 0)::numeric AS average_document_length
      FROM doc_lengths
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
      td.total_documents,
      dl.document_length,
      al.average_document_length
    FROM document_terms dt
    JOIN term_doc_freq tdf
      ON tdf.term = dt.term
    JOIN documents d
      ON d.id = dt.document_id
    JOIN doc_lengths dl
      ON dl.document_id = d.id
    CROSS JOIN total_docs td
    CROSS JOIN avg_length al
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