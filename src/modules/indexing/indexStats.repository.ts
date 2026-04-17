import type { PoolClient } from 'pg';
import type { TermPosting } from './indexer.types';

export async function upsertCorpusStats(
  client: PoolClient,
  documentLength: number
): Promise<void> {
  await client.query(
    `
    INSERT INTO corpus_stats (
      id,
      total_documents,
      total_document_length,
      average_document_length
    )
    VALUES (1, 1, $1::int, $1::numeric)
    ON CONFLICT (id)
    DO UPDATE SET
      total_documents = corpus_stats.total_documents + 1,
      total_document_length = corpus_stats.total_document_length + EXCLUDED.total_document_length,
      average_document_length =
        (corpus_stats.total_document_length + EXCLUDED.total_document_length)::numeric
        / (corpus_stats.total_documents + 1),
      updated_at = NOW()
    `,
    [documentLength]
  );
}

export async function upsertTermStats(
  client: PoolClient,
  postings: TermPosting[]
): Promise<void> {
  if (postings.length === 0) return;

  // 🔴 CRITICAL: sort terms to ensure consistent lock order
  postings.sort((a, b) => a.term.localeCompare(b.term));

  const values: unknown[] = [];

  const placeholders = postings
    .map((posting, index) => {
      const base = index * 3;

      values.push(posting.term, 1, posting.termFrequency);

      return `($${base + 1}::text, $${base + 2}::int, $${base + 3}::int)`;
    })
    .join(', ');

  await client.query(
    `
    INSERT INTO term_stats (
      term,
      document_frequency,
      total_term_frequency
    )
    VALUES ${placeholders}
    ON CONFLICT (term)
    DO UPDATE SET
      document_frequency = term_stats.document_frequency + EXCLUDED.document_frequency,
      total_term_frequency = term_stats.total_term_frequency + EXCLUDED.total_term_frequency,
      updated_at = NOW()
    `,
    values
  );
}