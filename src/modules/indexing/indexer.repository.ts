import type { PoolClient } from 'pg';
import { pool } from '../../config/postgres';
import type { TermPosting } from './indexer.types';

export async function insertDocumentTerms(
  client: PoolClient,
  documentId: string,
  postings: TermPosting[]
): Promise<void> {
  if (postings.length === 0) return;

  const values: unknown[] = [];

  const placeholders = postings
    .map((posting, index) => {
      const base = index * 4;

      values.push(
        documentId,
        posting.term,
        posting.termFrequency,
        posting.positions
      );

      return `($${base + 1}::uuid, $${base + 2}::text, $${base + 3}::int, $${base + 4}::int[])`;
    })
    .join(', ');

  await client.query(
    `
    INSERT INTO document_terms (
      document_id,
      term,
      term_frequency,
      positions
    )
    VALUES ${placeholders}
    ON CONFLICT (document_id, term)
    DO UPDATE SET
      term_frequency = EXCLUDED.term_frequency,
      positions = EXCLUDED.positions
    `,
    values
  );
}

type TermRow = {
  id: string;
  document_id: string;
  term: string;
  term_frequency: number;
  positions: number[];
  created_at: Date;
};

export async function getDocumentTermsByDocumentId(documentId: string) {
  const result = await pool.query<TermRow>(
    `
    SELECT
      id,
      document_id,
      term,
      term_frequency,
      positions,
      created_at
    FROM document_terms
    WHERE document_id = $1::uuid
    ORDER BY term ASC
    `,
    [documentId]
  );

  return result.rows;
}