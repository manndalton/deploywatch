import {
  emptyRateLimitStore,
  recordRateLimit,
  getRateLimit,
  isRateLimited,
  pruneRateLimits,
  usagePercent,
} from "./ratelimit";

const NOW = 1_700_000_000_000;

describe("recordRateLimit", () => {
  it("stores an entry for the provider", () => {
    const store = emptyRateLimitStore();
    const next = recordRateLimit(store, {
      provider: "github",
      remaining: 45,
      limit: 60,
      resetAt: NOW + 60_000,
    });
    expect(getRateLimit(next, "github")).toMatchObject({
      provider: "github",
      remaining: 45,
      limit: 60,
    });
  });

  it("overwrites an existing entry", () => {
    let store = emptyRateLimitStore();
    store = recordRateLimit(store, { provider: "github", remaining: 10, limit: 60, resetAt: NOW + 1000 });
    store = recordRateLimit(store, { provider: "github", remaining: 5, limit: 60, resetAt: NOW + 2000 });
    expect(getRateLimit(store, "github")?.remaining).toBe(5);
  });
});

describe("isRateLimited", () => {
  it("returns true when remaining is 0 and reset is in the future", () => {
    let store = emptyRateLimitStore();
    store = recordRateLimit(store, { provider: "vercel", remaining: 0, limit: 100, resetAt: NOW + 30_000 });
    expect(isRateLimited(store, "vercel", NOW)).toBe(true);
  });

  it("returns false when reset time has passed", () => {
    let store = emptyRateLimitStore();
    store = recordRateLimit(store, { provider: "vercel", remaining: 0, limit: 100, resetAt: NOW - 1 });
    expect(isRateLimited(store, "vercel", NOW)).toBe(false);
  });

  it("returns false when remaining > 0", () => {
    let store = emptyRateLimitStore();
    store = recordRateLimit(store, { provider: "github", remaining: 3, limit: 60, resetAt: NOW + 5000 });
    expect(isRateLimited(store, "github", NOW)).toBe(false);
  });

  it("returns false for unknown provider", () => {
    expect(isRateLimited(emptyRateLimitStore(), "unknown", NOW)).toBe(false);
  });
});

describe("pruneRateLimits", () => {
  it("removes expired entries", () => {
    let store = emptyRateLimitStore();
    store = recordRateLimit(store, { provider: "github", remaining: 0, limit: 60, resetAt: NOW - 1 });
    store = recordRateLimit(store, { provider: "vercel", remaining: 0, limit: 100, resetAt: NOW + 5000 });
    const pruned = pruneRateLimits(store, NOW);
    expect(getRateLimit(pruned, "github")).toBeUndefined();
    expect(getRateLimit(pruned, "vercel")).toBeDefined();
  });
});

describe("usagePercent", () => {
  it("calculates correct percentage", () => {
    const entry = { provider: "github", remaining: 15, limit: 60, resetAt: NOW + 1000, recordedAt: NOW };
    expect(usagePercent(entry)).toBe(75);
  });

  it("returns 0 when limit is 0", () => {
    const entry = { provider: "github", remaining: 0, limit: 0, resetAt: NOW, recordedAt: NOW };
    expect(usagePercent(entry)).toBe(0);
  });
});
