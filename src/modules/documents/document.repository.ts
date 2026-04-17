import type { Pool, PoolClient } from 'pg';
import { pool } from '../../config/postgres';
import type { CreateDocumentInput, DocumentRecord } from './document.types';

type QueryExecutor = Pool | PoolClient;

type DocumentDbRow = {
  id: string;
  title: string;
  url: string | null;
  raw_content: string;
  clean_content: string;
  content_hash: string;
  source_type: 'manual' | 'crawl';
  document_length: number;
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
    documentLength: row.document_length,
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
      document_length,
      created_at,
      updated_at
    FROM documents
    WHERE content_hash = $1::text
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
      document_length,
      created_at,
      updated_at
    FROM documents
    WHERE url = $1::text
    LIMIT 1
    `,
    [url]
  );

  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}

export async function createDocument(
  executor: QueryExecutor,
  data: CreateDocumentInput & {
    cleanContent: string;
    contentHash: string;
    documentLength: number;
  }
): Promise<DocumentRecord> {
  const result = await executor.query<DocumentDbRow>(
    `
    INSERT INTO documents (
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type,
      document_length
    )
    VALUES (
  $1::text,
  $2::text,
  $3::text,
  $4::text,
  $5::text,
  $6::text,
  $7::int
)
    RETURNING
      id,
      title,
      url,
      raw_content,
      clean_content,
      content_hash,
      source_type,
      document_length,
      created_at,
      updated_at
    `,
    [
      data.title,
      data.url ?? null,
      data.content,
      data.cleanContent,
      data.contentHash,
      data.sourceType ?? 'manual',
      data.documentLength
    ]
  );

  return mapRow(result.rows[0]);
}