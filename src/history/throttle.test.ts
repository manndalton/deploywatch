import {
  emptyThrottleStore,
  shouldFire,
  recordFire,
  pruneThrottleStore,
  resetThrottle,
} from "./throttle";

const BASE = 1_700_000_000_000;

describe("emptyThrottleStore", () => {
  it("returns a store with no entries", () => {
    expect(emptyThrottleStore()).toEqual({ entries: {} });
  });
});

describe("shouldFire", () => {
  it("returns true when key has never been fired", () => {
    const store = emptyThrottleStore();
    expect(shouldFire(store, "deploy:abc", 60_000, BASE)).toBe(true);
  });

  it("returns false when within cooldown window", () => {
    let store = emptyThrottleStore();
    store = recordFire(store, "deploy:abc", BASE);
    expect(shouldFire(store, "deploy:abc", 60_000, BASE + 30_000)).toBe(false);
  });

  it("returns true when cooldown has elapsed", () => {
    let store = emptyThrottleStore();
    store = recordFire(store, "deploy:abc", BASE);
    expect(shouldFire(store, "deploy:abc", 60_000, BASE + 60_000)).toBe(true);
  });
});

describe("recordFire", () => {
  it("creates a new entry on first fire", () => {
    const store = recordFire(emptyThrottleStore(), "k1", BASE);
    expect(store.entries["k1"]).toEqual({ key: "k1", lastFiredAt: BASE, count: 1 });
  });

  it("increments count on subsequent fires", () => {
    let store = emptyThrottleStore();
    store = recordFire(store, "k1", BASE);
    store = recordFire(store, "k1", BASE + 1000);
    expect(store.entries["k1"].count).toBe(2);
    expect(store.entries["k1"].lastFiredAt).toBe(BASE + 1000);
  });

  it("does not mutate the original store", () => {
    const original = emptyThrottleStore();
    recordFire(original, "k1", BASE);
    expect(original.entries).toEqual({});
  });
});

describe("pruneThrottleStore", () => {
  it("removes entries older than maxAgeMs", () => {
    let store = emptyThrottleStore();
    store = recordFire(store, "old", BASE);
    store = recordFire(store, "recent", BASE + 90_000);
    const pruned = pruneThrottleStore(store, 60_000, BASE + 100_000);
    expect(pruned.entries["old"]).toBeUndefined();
    expect(pruned.entries["recent"]).toBeDefined();
  });

  it("keeps all entries when none are expired", () => {
    let store = emptyThrottleStore();
    store = recordFire(store, "a", BASE);
    const pruned = pruneThrottleStore(store, 60_000, BASE + 10_000);
    expect(Object.keys(pruned.entries)).toHaveLength(1);
  });
});

describe("resetThrottle", () => {
  it("removes the specified key", () => {
    let store = recordFire(emptyThrottleStore(), "k1", BASE);
    store = resetThrottle(store, "k1");
    expect(store.entries["k1"]).toBeUndefined();
  });

  it("leaves other keys intact", () => {
    let store = recordFire(emptyThrottleStore(), "k1", BASE);
    store = recordFire(store, "k2", BASE);
    store = resetThrottle(store, "k1");
    expect(store.entries["k2"]).toBeDefined();
  });
});
