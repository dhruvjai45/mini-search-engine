import { ConflictError } from '../../common/errors/AppError';
import { hashContent } from '../../common/utils/hashContent';
import { normalizeText } from '../../common/utils/normalizeText';
import { tokenize } from '../../common/utils/tokenize';
import {createDocument, findDocumentByContentHash, findDocumentByUrl} from './document.repository';
import type {CreateDocumentInput, DocumentIngestResponse} from './document.types';

export async function ingestDocument(
  input: CreateDocumentInput
): Promise<DocumentIngestResponse> {
  const cleanContent = normalizeText(input.content);
  const tokens = tokenize(cleanContent, { removeStopWords: true });
  const contentHash = hashContent(cleanContent);

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

  const saved = await createDocument({
    title: input.title,
    content: input.content,
    url: input.url ?? null,
    sourceType: input.sourceType ?? 'manual',
    cleanContent,
    contentHash
  });

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
}