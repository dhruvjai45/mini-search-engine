import 'dotenv/config';
import { cleanText, ingestDocuments, truncate } from './ingest-utils';

type WikiPage = {
  title?: string;
  fullurl?: string;
  extract?: string;
};

type WikiResponse = {
  query?: {
    pages?: Record<string, WikiPage>;
  };
};

const TOPICS = [
  // Core AI
  'machine learning',
  'deep learning',
  'artificial intelligence',
  'neural networks',
  'computer vision',
  'natural language processing',

  // Systems (VERY important for SDE)
  'distributed systems',
  'operating systems',
  'database systems',
  'computer networks',

  // Search-related (directly boosts your project relevance)
  'information retrieval',
  'search engines',
  'ranking algorithms',
  'pagerank',

  // Backend / infra
  'system design',
  'caching',
  'load balancing',
  'microservices',
  'cloud computing',

  // Data + ML fundamentals
  'data science',
  'statistics',
  'linear algebra',
  'probability theory',

  // Modern topics (adds edge)
  'transformers',
  'large language models',
  'vector databases',
  'semantic search'
];

const MAX_PER_TOPIC = 15;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTopic(topic: string): Promise<WikiPage[]> {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query` +
    `&generator=search` +
    `&gsrsearch=${encodeURIComponent(topic)}` +
    `&gsrlimit=${MAX_PER_TOPIC}` +
    `&prop=extracts|info` +
    `&exintro=1&explaintext=1` +
    `&inprop=url` +
    `&format=json&origin=*`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'mini-search-engine/1.0'
      }
    });

    const text = await res.text();

    // 🚨 block detection
    if (
      text.includes('too many requests') ||
      text.startsWith('<!DOCTYPE')
    ) {
      console.log('⚠️ Rate limited, skipping topic...');
      await sleep(4000);
      return [];
    }

    const data: WikiResponse = JSON.parse(text);

    return Object.values(data.query?.pages || {});
  } catch {
    return [];
  }
}

async function run() {
  const docs: any[] = [];
  const seen = new Set<string>();

  for (const topic of TOPICS) {
    console.log(`\nFetching: ${topic}`);

    const pages = await fetchTopic(topic);

    for (const page of pages) {
      if (!page.title || !page.extract || page.extract.length < 200) continue;

      const url =
        page.fullurl ||
        `https://en.wikipedia.org/wiki/${page.title.replace(/ /g, '_')}`;

      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      docs.push({
        title: cleanText(page.title),
        content: truncate(cleanText(page.extract), 12000),
        url,
        sourceType: 'crawl'
      });
    }

    await sleep(2000); // 🚨 avoid block
  }

  console.log(`\nWikipedia docs collected: ${docs.length}`);
  await ingestDocuments(docs, 'WIKIPEDIA');
}

run();