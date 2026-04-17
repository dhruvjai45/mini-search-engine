import { CACHE_CONFIG } from './cacheKeys';
import { LruCache } from './lruCache';

class CacheService {
  private readonly cache = new LruCache<string, unknown>(
    CACHE_CONFIG.MAX_ENTRIES,
    CACHE_CONFIG.SEARCH_TTL_MS
  );

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, value, ttlMs);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  get size(): number {
    return this.cache.size;
  }
}

export const cacheService = new CacheService();