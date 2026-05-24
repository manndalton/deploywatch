/**
 * Throttle store: tracks per-key notification cooldowns to prevent
 * alert fatigue when the same deployment flaps repeatedly.
 */

export interface ThrottleEntry {
  key: string;
  lastFiredAt: number;
  count: number;
}

export interface ThrottleStore {
  entries: Record<string, ThrottleEntry>;
}

export function emptyThrottleStore(): ThrottleStore {
  return { entries: {} };
}

/** Returns true when the key is allowed to fire (not throttled). */
export function shouldFire(
  store: ThrottleStore,
  key: string,
  cooldownMs: number,
  now: number = Date.now()
): boolean {
  const entry = store.entries[key];
  if (!entry) return true;
  return now - entry.lastFiredAt >= cooldownMs;
}

/** Record that a notification for this key was fired. */
export function recordFire(
  store: ThrottleStore,
  key: string,
  now: number = Date.now()
): ThrottleStore {
  const existing = store.entries[key];
  return {
    entries: {
      ...store.entries,
      [key]: {
        key,
        lastFiredAt: now,
        count: existing ? existing.count + 1 : 1,
      },
    },
  };
}

/** Remove entries older than maxAgeMs to keep the store tidy. */
export function pruneThrottleStore(
  store: ThrottleStore,
  maxAgeMs: number,
  now: number = Date.now()
): ThrottleStore {
  const entries: Record<string, ThrottleEntry> = {};
  for (const [key, entry] of Object.entries(store.entries)) {
    if (now - entry.lastFiredAt < maxAgeMs) {
      entries[key] = entry;
    }
  }
  return { entries };
}

/** Reset throttle state for a specific key. */
export function resetThrottle(
  store: ThrottleStore,
  key: string
): ThrottleStore {
  const entries = { ...store.entries };
  delete entries[key];
  return { entries };
}

/**
 * Returns the number of milliseconds remaining before the key is allowed
 * to fire again, or 0 if it is not currently throttled.
 */
export function cooldownRemaining(
  store: ThrottleStore,
  key: string,
  cooldownMs: number,
  now: number = Date.now()
): number {
  const entry = store.entries[key];
  if (!entry) return 0;
  const elapsed = now - entry.lastFiredAt;
  return Math.max(0, cooldownMs - elapsed);
}
