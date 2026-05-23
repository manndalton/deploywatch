import {
  emptyBaselineStore,
  createBaseline,
  addBaseline,
  removeBaseline,
  findBaselineById,
  findBaselineByLabel,
  compareToBaseline,
  pruneBaselines,
} from './baseline';
import { HistoryEntry } from './history';

function makeEntry(id: string, status: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    startedAt: Date.now(),
    duration: 60,
    tags: [],
  } as unknown as HistoryEntry;
}

describe('baseline', () => {
  it('creates an empty store', () => {
    const store = emptyBaselineStore();
    expect(store.baselines).toHaveLength(0);
  });

  it('creates a baseline with a unique id', () => {
    const entries = [makeEntry('e1', 'success')];
    const b1 = createBaseline('v1', entries);
    const b2 = createBaseline('v2', entries);
    expect(b1.id).not.toBe(b2.id);
    expect(b1.label).toBe('v1');
    expect(b1.entries).toHaveLength(1);
  });

  it('adds and removes baselines', () => {
    let store = emptyBaselineStore();
    const b = createBaseline('prod', [makeEntry('e1', 'success')]);
    store = addBaseline(store, b);
    expect(store.baselines).toHaveLength(1);
    store = removeBaseline(store, b.id);
    expect(store.baselines).toHaveLength(0);
  });

  it('finds baseline by id and label', () => {
    let store = emptyBaselineStore();
    const b = createBaseline('staging', []);
    store = addBaseline(store, b);
    expect(findBaselineById(store, b.id)).toBe(b);
    expect(findBaselineByLabel(store, 'staging')).toBe(b);
    expect(findBaselineById(store, 'nope')).toBeUndefined();
  });

  it('compares entries to baseline', () => {
    const e1 = makeEntry('e1', 'success');
    const e2 = makeEntry('e2', 'failure');
    const e3 = makeEntry('e3', 'success');
    const baseline = createBaseline('base', [e1, e2]);
    const e2changed = { ...e2, status: 'success' };
    const result = compareToBaseline(baseline, [e1, e2changed, e3]);
    expect(result.added).toEqual([e3]);
    expect(result.removed).toHaveLength(0);
    expect(result.changed.map(e => e.id)).toContain('e2');
  });

  it('prunes old baselines keeping newest', () => {
    let store = emptyBaselineStore();
    for (let i = 0; i < 5; i++) {
      store = addBaseline(store, { ...createBaseline(`v${i}`, []), createdAt: i * 1000 });
    }
    const pruned = pruneBaselines(store, 3);
    expect(pruned.baselines).toHaveLength(3);
    expect(pruned.baselines.every(b => b.createdAt >= 2000)).toBe(true);
  });
});
