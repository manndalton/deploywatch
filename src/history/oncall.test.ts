import {
  emptyOncallStore,
  addOncallEntry,
  removeOncallEntry,
  getCurrentOncall,
  getUpcomingOncall,
  pruneOncall,
} from './oncall';

const NOW = 1_700_000_000_000;

function makeEntry(overrides: Partial<{ startTs: number; endTs: number; name: string }> = {}) {
  return {
    name: overrides.name ?? 'Alice',
    email: 'alice@example.com',
    startTs: overrides.startTs ?? NOW - 3600_000,
    endTs: overrides.endTs ?? NOW + 3600_000,
    timezone: 'UTC',
    tags: [],
  };
}

describe('oncall store', () => {
  it('starts empty', () => {
    expect(emptyOncallStore().entries).toHaveLength(0);
  });

  it('adds an entry', () => {
    const store = addOncallEntry(emptyOncallStore(), makeEntry());
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].name).toBe('Alice');
    expect(store.entries[0].id).toMatch(/^oncall-/);
  });

  it('removes an entry by id', () => {
    let store = addOncallEntry(emptyOncallStore(), makeEntry());
    const id = store.entries[0].id;
    store = removeOncallEntry(store, id);
    expect(store.entries).toHaveLength(0);
  });

  it('returns current oncall', () => {
    const store = addOncallEntry(emptyOncallStore(), makeEntry());
    const current = getCurrentOncall(store, NOW);
    expect(current?.name).toBe('Alice');
  });

  it('returns undefined when no active oncall', () => {
    const store = addOncallEntry(emptyOncallStore(), makeEntry({ endTs: NOW - 1 }));
    expect(getCurrentOncall(store, NOW)).toBeUndefined();
  });

  it('returns upcoming oncall sorted', () => {
    let store = emptyOncallStore();
    store = addOncallEntry(store, makeEntry({ name: 'Bob', startTs: NOW + 7200_000, endTs: NOW + 10800_000 }));
    store = addOncallEntry(store, makeEntry({ name: 'Carol', startTs: NOW + 3600_000, endTs: NOW + 7200_000 }));
    const upcoming = getUpcomingOncall(store, NOW);
    expect(upcoming[0].name).toBe('Carol');
    expect(upcoming[1].name).toBe('Bob');
  });

  it('prunes old entries', () => {
    const old = makeEntry({ startTs: NOW - 10 * 24 * 3600_000, endTs: NOW - 9 * 24 * 3600_000 });
    const recent = makeEntry({ startTs: NOW - 3600_000, endTs: NOW + 3600_000 });
    let store = addOncallEntry(emptyOncallStore(), old);
    store = addOncallEntry(store, recent);
    const pruned = pruneOncall(store, NOW);
    expect(pruned.entries).toHaveLength(1);
    expect(pruned.entries[0].name).toBe('Alice');
  });
});
