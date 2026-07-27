import { pool } from '../src/config/postgres';
import { normalizeText } from '../src/common/utils/normalizeText';
import { tokenize } from '../src/common/utils/tokenize';
import { buildTermPostings } from '../src/modules/indexing/indexer.service';
import { insertDocumentTerms } from '../src/modules/indexing/indexer.repository';
import { upsertCorpusStats, upsertTermStats } from '../src/modules/indexing/indexStats.repository';

type MissingDocumentRow = {
  id: string;
  title: string;
  raw_content: string;
  clean_content: string | null;
};

async function backfillMissingDocuments() {
  const result = await pool.query<MissingDocumentRow>(`
    SELECT d.id, d.title, d.raw_content, d.clean_content
    FROM documents d
    WHERE NOT EXISTS (
      SELECT 1
      FROM document_terms dt
      WHERE dt.document_id = d.id
    )
    ORDER BY d.created_at ASC
  `);

  console.log(`Found ${result.rowCount ?? 0} unindexed document(s).`);

  for (const doc of result.rows) {
    const sourceText =
      doc.clean_content && doc.clean_content.trim().length > 0
        ? doc.clean_content
        : doc.raw_content;

    const normalized = normalizeText(sourceText);
    const tokens = tokenize(normalized, { removeStopWords: true });

    if (tokens.length === 0) {
      console.log(`Skipping ${doc.id} (${doc.title}) — no searchable tokens.`);
      continue;
    }

    const postings = buildTermPostings(tokens);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await insertDocumentTerms(client, doc.id, postings);
      await upsertTermStats(client, postings);
      await upsertCorpusStats(client, tokens.length);

      await client.query('COMMIT');
      console.log(`Indexed ${doc.id} (${doc.title})`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Failed to index ${doc.id} (${doc.title})`, error);
    } finally {
      client.release();
    }
  }
}

backfillMissingDocuments()
  .then(() => {
    console.log('Reindex complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });