export type DocumentSourceType = 'manual' | 'crawl';

export interface CreateDocumentInput {
  title: string;
  content: string;
  url?: string | null;
  sourceType?: DocumentSourceType;
}

export interface DocumentRecord {
  id: string;
  title: string;
  url: string | null;
  rawContent: string;
  cleanContent: string;
  contentHash: string;
  sourceType: DocumentSourceType;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentIngestResponse {
  id: string;
  title: string;
  url: string | null;
  sourceType: DocumentSourceType;
  contentHash: string;
  tokenCount: number;
  uniqueTokenCount: number;
  createdAt: Date;
}