import 'dotenv/config';

export type SourceType = 'manual' | 'crawl';

export type IngestDocument = {
  title: string;
  content: string;
  url?: string | null;
  sourceType?: SourceType;
};

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const INGEST_DELAY_MS = Number(process.env.INGEST_DELAY_MS ?? 20);

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function cleanText(input: string): string {
  return input
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(input: string, max = 5000): string {
  const text = cleanText(input);
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function postDocument(doc: IngestDocument): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: cleanText(doc.title),
        content: truncate(doc.content, 12000),
        url: doc.url ?? null,
        sourceType: doc.sourceType ?? 'crawl'
      })
    });

    const data = (await response.json().catch(() => null)) as
      | { success?: boolean; message?: string }
      | null;

    if (!response.ok || !data?.success) {
      console.log('❌ Failed:', data?.message ?? `HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.log('❌ Failed:', error?.message ?? error);
    return false;
  }
}

export async function ingestDocuments(
  docs: IngestDocument[],
  label: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i += 1) {
    const ok = await postDocument(docs[i]);

    if (ok) success += 1;
    else failed += 1;

    if ((i + 1) % 25 === 0 || i === docs.length - 1) {
      console.log(`[${label}] Progress → ${i + 1}/${docs.length}`);
    }

    await sleep(INGEST_DELAY_MS);
  }

  console.log(`\n[${label}] DONE`);
  console.log(`[${label}] Total Success: ${success}`);
  console.log(`[${label}] Total Failed: ${failed}`);

  return { success, failed };
}