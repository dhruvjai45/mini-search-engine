# Mini Search Engine

Mini Search Engine is a backend-focused search platform built with Node.js, Express, TypeScript, and PostgreSQL. It is designed to demonstrate how a production-style search system works under the hood: document ingestion, tokenization, inverted indexing, ranking, autocomplete, spellcheck, caching, query logging, and click tracking.

---

## Overview

This project is a compact but serious search backend.

It stores documents in PostgreSQL, builds an inverted index with term frequencies and positions, ranks results using BM25-style scoring, and improves query UX with autocomplete and spellcheck. It also includes query caching, click tracking, and ingestion scripts for real data sources like Wikipedia and RSS feeds.

The goal of the project is not just to expose APIs. The goal is to show how search systems are actually engineered using data structures and algorithms.

---

## What This Project Demonstrates

- Inverted indexing
- Tokenization and normalization
- Stop-word removal
- BM25 ranking
- TF-IDF helper logic
- Trie-based autocomplete
- Levenshtein-distance spellcheck
- LRU cache with TTL
- Query logging and click analytics
- Transaction-safe document ingestion
- Real data ingestion from Wikipedia and RSS

---

## Key Features

### Document Ingestion

- Add documents through a REST API
- Store raw content and normalized content
- Prevent duplicate documents using URL and content hash checks
- Automatically tokenize and index every document
- Update autocomplete and spellcheck dictionaries after ingestion

### Search

- Search documents with pagination
- Rank results using BM25-style scoring
- Generate snippets from matching content
- Cache search responses for faster repeated queries
- Fall back to spellcheck when a query returns no results
- Support partial-match fallback for better recall

### Autocomplete

- Trie-based prefix suggestions
- Suggestions built from document titles, indexed terms, and query logs
- Frequency-aware ranking
- Cached suggestion results

### Spellcheck

- Query correction using Levenshtein distance
- Dictionary built from indexed terms
- Suggest corrected tokens and corrected full queries
- Cached spellcheck responses

### Analytics and Tracking

- Log every search query
- Track result counts and latency
- Track document clicks per query
- Expose document index details through API

### Ingestion Scripts

- Ingest documents from Wikipedia
- Ingest documents from RSS feeds
- Run combined ingestion for richer search data
- Reindex documents that were inserted without terms

---

## Architecture

| Layer | Implementation |
| --- | --- |
| API Server | Express 5 |
| Language | TypeScript |
| Database | PostgreSQL |
| Validation | Zod |
| Caching | In-memory LRU cache |
| Ranking | BM25 + TF-IDF helpers |
| Autocomplete | Trie |
| Spellcheck | Levenshtein distance |
| Logging | Lightweight structured logger |

---

## System Design

1. A document is received through the ingestion API.
2. The content is normalized and tokenized.
3. A content hash is created to stop duplicates.
4. The document is saved in PostgreSQL inside a transaction.
5. Term postings are created with term frequency and word positions.
6. Corpus-level and term-level statistics are updated.
7. Autocomplete and spellcheck dictionaries are updated in memory.
8. Search requests tokenize the user query, check the cache, rank matching documents, and return paginated results.
9. If no direct match is found, spellcheck is used to suggest a corrected query.
10. Clicks are recorded to improve analytics.

---

## API Endpoints

### Health

`GET /health`

Returns server health, uptime, and timestamp.

### Root

`GET /`

Returns a simple API status response.

### Documents

`POST /documents`

Ingests a document.

Example body:

```json
{
  "title": "Machine Learning",
  "content": "Machine learning is a field of study...",
  "url": "https://example.com/article",
  "sourceType": "manual"
}
```

### Search

`GET /search?q=machine+learning&page=1&limit=10`

Returns ranked search results.

Query parameters:

- `q` — required search query
- `page` — default `1`
- `limit` — default `10`, max `50`

### Click Tracking

`POST /search/click`

Example body:

```json
{
  "documentId": "uuid-here",
  "query": "machine learning"
}
```

### Document Index

`GET /index/documents/:documentId`

Returns the indexed terms for a document.

### Autocomplete

`GET /suggest?q=mach&limit=5`

Returns prefix suggestions.

### Spellcheck

`GET /spell?q=machin learng&limit=5`

Returns token-level and query-level spelling suggestions.

---

## Database Schema

The project uses PostgreSQL and creates these core tables:

- `documents` — stores document metadata and normalized content
- `document_terms` — stores the inverted index with term frequency and word positions
- `query_logs` — stores search analytics
- `crawl_jobs` — stores crawl job state
- `term_stats` — stores corpus-level term frequency and document frequency
- `corpus_stats` — stores corpus-wide document length statistics
- `document_clicks` — stores click counts per document/query pair

---

## Ranking and Search Logic

Search is not a dumb `LIKE` query.

The ranking pipeline uses:

- tokenization and stop-word filtering
- normalized query terms
- term-level document matching
- BM25 scoring
- title and phrase boosts
- snippet generation
- cached result reuse
- spellcheck fallback
- partial-match fallback for recall

This is the part that makes the project interview-worthy. It shows that you understand retrieval, not just CRUD.

---

## Data Structures and Algorithms Used

### Trie

Used for autocomplete suggestions and prefix matching.

### Min-Heap

Included in the search module for efficient ranked result handling.

### LRU Cache

Used to cache search, autocomplete, and spellcheck responses with TTL.

### Levenshtein Distance

Used for spellcheck correction.

### Token Postings

Each term stores frequency and positions, which is the backbone of an inverted index.

---

## Tech Stack

### Backend

- Node.js
- Express 5
- TypeScript

### Database

- PostgreSQL
- pg

### Validation and Utilities

- Zod
- dotenv
- cors
- axios
- csv-parse
- rss-parser

### Development Tools

- tsx
- TypeScript
- Jest
- Supertest
- ESLint
- Prettier

---

## Requirements

- Node.js 18 or above
- PostgreSQL 16 or above
- Docker and Docker Compose

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/dhruvjai45/mini-search-engine.git
cd mini-search-engine
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start PostgreSQL

The repository includes a Docker Compose setup for PostgreSQL. It uses `db/init.sql` to create the schema automatically.

```bash
docker compose up -d
```

### 4. Create the environment file

Create a `.env` file in the project root:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mini_search_engine
CORS_ORIGIN=*
RSS_FEED_URLS=https://example.com/feed1.xml,https://example.com/feed2.xml
RSS_MAX_ITEMS_PER_FEED=50
RSS_MAX_TOTAL_DOCS=500
```

### 5. Run the app in development mode

```bash
npm run dev
```

### 6. Open the API

```
http://localhost:5000
```

---

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run ingest:wikipedia
npm run ingest:rss
npm run ingest:all
npm run reindex:missing
```

### Script Notes

- `ingest:wikipedia` — fetches and ingests Wikipedia-based content
- `ingest:rss` — ingests content from RSS feeds defined in `.env`
- `ingest:all` — runs both ingestion pipelines
- `reindex:missing` — rebuilds index entries for documents that were inserted without terms

---

## Real Data Ingestion

The project includes ingestion scripts that pull real content from external sources.

### Wikipedia

The Wikipedia ingest script targets a curated list of technical topics such as:

- machine learning
- deep learning
- artificial intelligence
- distributed systems
- operating systems
- information retrieval
- search engines
- caching
- system design
- semantic search

### RSS

The RSS ingest script reads feed URLs from `RSS_FEED_URLS` and ingests article content into the document store.

This is a good design choice because it gives the search engine real text instead of fake demo data.

---

## Project Structure

```
db/
  ├── init.sql

scripts/
  ├── ingest-wikipedia.ts
  ├── ingest-rss.ts
  ├── ingest-real-data.ts
  ├── reindex-missing-documents.ts

src/
  ├── app.ts
  ├── main.ts
  ├── server.ts
  ├── config/
  ├── common/
  ├── middlewares/
  ├── routes/
  ├── modules/
```

### Modules

```
src/modules/
  ├── autocomplete/
  ├── cache/
  ├── documents/
  ├── indexing/
  ├── search/
  ├── spellcheck/
```

---

## Error Handling

The API uses structured errors and validation checks for:

- invalid request bodies
- invalid query parameters
- duplicate documents
- missing routes
- database failures

This keeps the backend clean and prevents silent corruption.

---

## Performance Choices

- Cached search responses for repeated queries
- Cached autocomplete suggestions
- Cached spellcheck corrections
- PostgreSQL indexes on key lookup columns
- Bulk ingestion with transactions
- In-memory autocomplete and spellcheck dictionaries

---

## Future Improvements

- Redis-based distributed cache
- Background job queue for ingestion
- Web crawler for automatic document discovery
- Better relevance tuning
- Synonym expansion
- Query intent detection
- Highlighted snippets in results
- Admin endpoints for corpus statistics
- Rate limiting and auth for public deployment

---

## Why This Project Matters

This is not a toy project.

It shows that you can design a system around retrieval quality, indexing, and performance. It also gives you concrete things to talk about in interviews:

- Why use an inverted index?
- Why store term positions?
- Why cache search results?
- Why use BM25 instead of raw term count?
- Why use a trie for autocomplete?
- Why use Levenshtein for spellcheck?
- Why keep corpus statistics in the database?

If you can answer those, you understand the project.

---

## Author

Dhruv Jain

---

## Support

If you find this project useful, consider starring the repository.
