import { pool } from '../../config/postgres';
import type { CreateDocumentInput, DocumentRecord } from './document.types';

type DocumentDbRow = {
  id: string;
  title: string;
  url: string | null;
  raw_content: string;
  clean_content: string;
  content_hash: string;
  source_type: 'manual' | 'crawl';
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: DocumentDbRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    rawContent: row.raw_content,
    cleanContent: row.clean_content,
    contentHash: row.content_hash,
    sourceType: row.source_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function findDocumentByContentHash(
  contentHash: string
): Promise<DocumentRecord | null> {
  const result = await pool.query<DocumentDbRow>(
    `
    SELECT
      id,
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type,
      created_at,
      updated_at
    FROM documents
    WHERE content_hash = $1
    LIMIT 1
    `,
    [contentHash]
  );

  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}

export async function findDocumentByUrl(
  url: string
): Promise<DocumentRecord | null> {
  const result = await pool.query<DocumentDbRow>(
    `
    SELECT
      id,
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type,
      created_at,
      updated_at
    FROM documents
    WHERE url = $1
    LIMIT 1
    `,
    [url]
  );

  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}

export async function createDocument(
  data: CreateDocumentInput & { cleanContent: string; contentHash: string }
): Promise<DocumentRecord> {
  const result = await pool.query<DocumentDbRow>(
    `
    INSERT INTO documents (
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type,
      created_at,
      updated_at
    `,
    [
      data.title,
      data.url ?? null,
      data.content,
      data.cleanContent,
      data.contentHash,
      data.sourceType ?? 'manual'
    ]
  );

  return mapRow(result.rows[0]);
}