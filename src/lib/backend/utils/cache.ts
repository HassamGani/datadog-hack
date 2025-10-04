/**
 * Cache Layer
 * Simple in-memory cache with TTL for expensive operations
 */

import { CACHE_TTL } from '../config';

export class Cache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? 300; // Default 5 minutes
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const pricesCache = new Cache<any>();
export const newsCache = new Cache<any>();
export const eventsCache = new Cache<any>();
export const translationsCache = new Cache<any>();
export const altDataCache = new Cache<any>();

// Periodic cleanup
setInterval(() => {
  pricesCache.cleanup();
  newsCache.cleanup();
  eventsCache.cleanup();
  translationsCache.cleanup();
  altDataCache.cleanup();
}, 60000); // Every minute

/**
 * Helper to generate cache keys
 */
export function generateCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.map((a) => JSON.stringify(a)).join(':')}`;
}
