/**
 * TTL Cache for Memory API responses.
 * Eliminates repeated Python cold starts (3.1s -> 0ms on repeat calls).
 *
 * Usage:
 *   const cache = MemoryCache.getInstance();
 *   const data = await cache.getOrFetch("entries:knowledge", () => fetchEntries("knowledge"));
 */

export class MemoryCache {
  private static instance: MemoryCache;
  private cache = new Map<string, { data: unknown; expires: number }>();
  private defaultTtl: number;

  private constructor(ttlMs = 60_000) {
    this.defaultTtl = ttlMs;
  }

  static getInstance(ttlMs?: number): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache(ttlMs);
    }
    return MemoryCache.instance;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlMs ?? this.defaultTtl),
    });
  }

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  /** How many entries are currently cached (for stats/diagnostics) */
  get size(): number {
    return this.cache.size;
  }
}
