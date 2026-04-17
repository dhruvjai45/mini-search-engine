type CacheEntry<V> = {
  value: V;
  expiresAt: number | null;
};

export class LruCache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>();

  constructor(
    private readonly maxEntries: number,
    private readonly defaultTtlMs: number
  ) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null;

    this.store.set(key, { value, expiresAt });

    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value as K | undefined;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): K[] {
    return Array.from(this.store.keys());
  }

  get size(): number {
    return this.store.size;
  }
}