import { pool } from '../../config/postgres';
import { normalizeText } from '../../common/utils/normalizeText';
import { tokenize } from '../../common/utils/tokenize';
import { buildTermPostings } from './indexer.service';
import { insertDocumentTerms } from './indexer.repository';
import { upsertCorpusStats, upsertTermStats } from './indexStats.repository';

type MissingDocRow = {
  id: string;
  title: string;
  raw_content: string;
  clean_content: string | null;
};

export async function backfillUnindexedDocuments(): Promise<{
  scanned: number;
  indexed: number;
}> {
  const result = await pool.query<MissingDocRow>(`
    SELECT d.id, d.title, d.raw_content, d.clean_content
    FROM documents d
    WHERE NOT EXISTS (
      SELECT 1
      FROM document_terms dt
      WHERE dt.document_id = d.id
    )
    ORDER BY d.created_at ASC
  `);

  let indexed = 0;

  for (const doc of result.rows) {
    const content =
      doc.clean_content && doc.clean_content.trim().length > 0
        ? doc.clean_content
        : doc.raw_content;

    const normalized = normalizeText(content);
    const tokens = tokenize(normalized, { removeStopWords: true });

    if (tokens.length === 0) continue;

    const postings = buildTermPostings(tokens);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await insertDocumentTerms(client, doc.id, postings);
      await upsertTermStats(client, postings);
      await upsertCorpusStats(client, tokens.length);

      await client.query('COMMIT');
      indexed++;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return { scanned: result.rowCount ?? result.rows.length, indexed };
}