export const CACHE_CONFIG = {
  MAX_ENTRIES: 2000,
  SEARCH_TTL_MS: 5 * 60 * 1000,
  SUGGEST_TTL_MS: 10 * 60 * 1000,
  SPELL_TTL_MS: 10 * 60 * 1000
} as const;

export const cacheKeys = {
  search: (query: string, page: number, limit: number) =>
    `search:${query}:p${page}:l${limit}`,

  suggest: (prefix: string, limit: number) =>
    `suggest:${prefix}:l${limit}`,

  spell: (query: string, limit: number) =>
    `spell:${query}:l${limit}`
};