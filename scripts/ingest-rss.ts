import 'dotenv/config';
import Parser from 'rss-parser';
import { cleanText, ingestDocuments, truncate } from './ingest-utils';

type RssItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
};

const parser: Parser = new Parser({
  timeout: 20000
});

const RSS_FEEDS = (process.env.RSS_FEED_URLS ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

const MAX_ITEMS_PER_FEED = Number(process.env.RSS_MAX_ITEMS_PER_FEED ?? 50);
const MAX_TOTAL_DOCS = Number(process.env.RSS_MAX_TOTAL_DOCS ?? 500);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFeedWithRetry(url: string, retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      const feed = await parser.parseURL(url);
      console.log(`Fetched from ${url}`);
      return feed;
    } catch (err: any) {
      console.log(`Retry ${i} for ${url}`);

      if (i === retries) {
        console.log(`❌ Skipping feed: ${url}`);
        return null;
      }

      await sleep(2000 * i); // exponential backoff
    }
  }
}

async function run() {
  if (RSS_FEEDS.length === 0) {
    throw new Error(
      'Set RSS_FEED_URLS in .env (comma-separated URLs)'
    );
  }

  const docs: Array<{
    title: string;
    content: string;
    url: string;
    sourceType: 'crawl';
  }> = [];

  const seen = new Set<string>();

  for (const feedUrl of RSS_FEEDS) {
    if (docs.length >= MAX_TOTAL_DOCS) break;

    const feed = await fetchFeedWithRetry(feedUrl);
    if (!feed) continue;

    const items = (feed.items as RssItem[]).slice(0, MAX_ITEMS_PER_FEED);

    for (const item of items) {
      if (docs.length >= MAX_TOTAL_DOCS) break;

      const title = cleanText(item.title ?? '');
      const url = item.link?.trim() ?? '';

      if (!title || !url) continue;

      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const content = truncate(
        cleanText(
          `${item.contentSnippet ?? ''} ${item.content ?? ''}`
        ),
        12000
      );

      // 🚨 skip useless content
      if (content.length < 200) continue;

      docs.push({
        title,
        content,
        url,
        sourceType: 'crawl'
      });
    }

    // 🚨 VERY IMPORTANT: avoid rate limits
    await sleep(1500);
  }

  console.log(`\nRSS docs collected: ${docs.length}`);
  await ingestDocuments(docs, 'RSS');
}

void run();