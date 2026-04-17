import { pool } from '../../config/postgres';

export async function recordClick(
  documentId: string,
  query: string
): Promise<void> {
  await pool.query(
    `
    INSERT INTO document_clicks (document_id, query, click_count)
    VALUES ($1::uuid, $2::text, 1)
    ON CONFLICT (document_id, query)
    DO UPDATE SET
      click_count = document_clicks.click_count + 1,
      updated_at = NOW()
    `,
    [documentId, query.toLowerCase()]
  );
}