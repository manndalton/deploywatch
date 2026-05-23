/**
 * Rate limit tracking for deployment providers.
 * Stores per-provider rate limit state and exposes helpers to check
 * whether a provider is currently throttled.
 */

export interface RateLimitEntry {
  provider: string;
  remaining: number;
  limit: number;
  resetAt: number; // unix ms
  recordedAt: number;
}

export interface RateLimitStore {
  entries: Record<string, RateLimitEntry>;
}

export function emptyRateLimitStore(): RateLimitStore {
  return { entries: {} };
}

export function recordRateLimit(
  store: RateLimitStore,
  entry: Omit<RateLimitEntry, "recordedAt">
): RateLimitStore {
  return {
    entries: {
      ...store.entries,
      [entry.provider]: { ...entry, recordedAt: Date.now() },
    },
  };
}

export function getRateLimit(
  store: RateLimitStore,
  provider: string
): RateLimitEntry | undefined {
  return store.entries[provider];
}

export function isRateLimited(
  store: RateLimitStore,
  provider: string,
  now: number = Date.now()
): boolean {
  const entry = store.entries[provider];
  if (!entry) return false;
  if (now >= entry.resetAt) return false;
  return entry.remaining <= 0;
}

export function pruneRateLimits(
  store: RateLimitStore,
  now: number = Date.now()
): RateLimitStore {
  const entries: Record<string, RateLimitEntry> = {};
  for (const [key, entry] of Object.entries(store.entries)) {
    if (entry.resetAt > now) {
      entries[key] = entry;
    }
  }
  return { entries };
}

export function usagePercent(entry: RateLimitEntry): number {
  if (entry.limit === 0) return 0;
  return Math.round(((entry.limit - entry.remaining) / entry.limit) * 100);
}
