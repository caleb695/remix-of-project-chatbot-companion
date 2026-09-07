// Performance utilities for caching, batching, and timing
// Centralized caching and performance helpers for the application

import { createHash } from "crypto";

/**
 * Simple timer utility for measuring operation duration
 */
export class Timer {
  private start: number;
  private label: string;

  constructor(label: string = "") {
    this.label = label;
    this.start = performance.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return performance.now() - this.start;
  }

  /**
   * Log the elapsed time and return it
   */
  log(): number {
    const elapsed = this.elapsed();
    if (this.label) {
      console.log(`[Timer:${this.label}] ${elapsed.toFixed(2)}ms`);
    }
    return elapsed;
  }

  /**
   * Get elapsed time and reset the timer
   */
  lap(): number {
    const elapsed = this.elapsed();
    this.start = performance.now();
    return elapsed;
  }
}

/**
 * Execute a function with a timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000,
  timeoutMessage: string = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 100,
        maxDelay
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Simple in-memory cache with TTL
 * Entry structure: { data: T, timestamp: number } for compatibility with existing code
 */
export class SimpleCache<T = unknown> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttlMs: number;
  private maxSize: number;

  constructor(ttlMs: number = 300000, maxSize: number = 1000) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): { data: T; timestamp: number } | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  set(key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  // Expose keys for invalidation
  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}

// Global cache instances with appropriate TTLs
// File content cache (5 minutes) - stores { content: string; status: string }
export const fileContentCache = new SimpleCache<{ content: string; status: string }>(5 * 60 * 1000, 500);

// Search code cache (2 minutes) - stores search results
// Note: Type adjusted to match actual usage in search_code tool
export const searchCodeCache = new SimpleCache<any>(2 * 60 * 1000, 200);

// Web search cache (10 minutes)
export const webSearchCache = new SimpleCache<string>(10 * 60 * 1000, 100);

// URL fetch cache (10 minutes)
export const fetchUrlCache = new SimpleCache<string>(10 * 60 * 1000, 200);

// File list cache (30 seconds) - stores array of { path: string; status: string }
export const fileListCache = new SimpleCache<any[]>(30_000, 100);

// Embedding cache (5 minutes)
export const embeddingCache = new SimpleCache<any>(5 * 60 * 1000, 50);

/**
 * Generate a consistent cache key from various inputs
 */
export function generateCacheKey(...parts: (string | number | boolean | undefined | null)[]): string {
  const filtered = parts.filter((p) => p !== undefined && p !== null);
  if (filtered.length === 0) return "";
  const key = filtered.join(":");
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/**
 * Process an array in batches
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  return results;
}

/**
 * Batch an array into chunks
 */
export function batchArray<T>(array: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<string, { size: number; byteSize: number }> {
  const caches = {
    fileContentCache,
    searchCodeCache,
    webSearchCache,
    fetchUrlCache,
    fileListCache,
    embeddingCache,
  };

  const stats: Record<string, { size: number; byteSize: number }> = {};

  for (const [name, cache] of Object.entries(caches)) {
    stats[name] = {
      size: cache.size,
      byteSize: 0, // SimpleCache doesn't track byte size
    };
  }

  return stats;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  fileContentCache.clear();
  searchCodeCache.clear();
  webSearchCache.clear();
  fetchUrlCache.clear();
  fileListCache.clear();
  embeddingCache.clear();
}
