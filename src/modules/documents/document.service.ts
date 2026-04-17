import { pool } from '../../config/postgres';
import { ConflictError } from '../../common/errors/AppError';
import { hashContent } from '../../common/utils/hashContent';
import { normalizeText } from '../../common/utils/normalizeText';
import { tokenize } from '../../common/utils/tokenize';
import { cacheService } from '../cache/cache.service';
import { autocompleteService } from '../autocomplete/autocomplete.service';
import { spellcheckService } from '../spellcheck/spellcheck.service';
import { buildTermPostings } from '../indexing/indexer.service';
import { insertDocumentTerms } from '../indexing/indexer.repository';
import { upsertCorpusStats, upsertTermStats } from '../indexing/indexStats.repository';
import {
  createDocument,
  findDocumentByContentHash,
  findDocumentByUrl
} from './document.repository';
import type {
  CreateDocumentInput,
  DocumentIngestResponse
} from './document.types';

export async function ingestDocument(
  input: CreateDocumentInput
): Promise<DocumentIngestResponse> {
  const cleanContent = normalizeText(input.content);
  const titleTokens = tokenize(normalizeText(input.title), {
    removeStopWords: true
  });
  const tokens = tokenize(cleanContent, { removeStopWords: true });
  const contentHash = hashContent(cleanContent);
  const documentLength = tokens.length;

  if (input.url) {
    const existingUrlDoc = await findDocumentByUrl(input.url);
    if (existingUrlDoc) {
      throw new ConflictError('A document with this URL already exists');
    }
  }

  const existingContentDoc = await findDocumentByContentHash(contentHash);
  if (existingContentDoc) {
    throw new ConflictError('Duplicate document content detected');
  }

  const postings = buildTermPostings(tokens);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saved = await createDocument(client, {
      title: input.title,
      content: input.content,
      url: input.url ?? null,
      sourceType: input.sourceType ?? 'manual',
      cleanContent,
      contentHash,
      documentLength
    });

    await insertDocumentTerms(client, saved.id, postings);
    await upsertTermStats(client, postings);
    await upsertCorpusStats(client, documentLength);

    await client.query('COMMIT');

    autocompleteService.addSuggestion(saved.title, 3);
    spellcheckService.addTerms(titleTokens, 2);
    spellcheckService.addTerms(tokens, 1);

    cacheService.clear();

    return {
      id: saved.id,
      title: saved.title,
      url: saved.url,
      sourceType: saved.sourceType,
      contentHash: saved.contentHash,
      tokenCount: tokens.length,
      uniqueTokenCount: new Set(tokens).size,
      createdAt: saved.createdAt
    };
  } catch (error: unknown) {
    await client.query('ROLLBACK');

    const err = error as { code?: string; detail?: string };

    if (err.code === '23505') {
      const detail = err.detail ?? '';
      if (detail.includes('documents_url_key') || detail.includes('url')) {
        throw new ConflictError('A document with this URL already exists');
      }
      if (
        detail.includes('content_hash') ||
        detail.includes('documents_content_hash_key')
      ) {
        throw new ConflictError('Duplicate document content detected');
      }
      throw new ConflictError('Duplicate document detected');
    }

    throw error;
  } finally {
    client.release();
  }
}