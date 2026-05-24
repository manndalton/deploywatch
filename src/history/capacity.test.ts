import {
  emptyCapacityStore,
  addCapacityPoint,
  pruneCapacityPoints,
  buildCapacityForecast,
} from './capacity';

function msAfter(base: Date, ms: number): Date {
  return new Date(base.getTime() + ms);
}

describe('emptyCapacityStore', () => {
  it('creates store with given limit', () => {
    const store = emptyCapacityStore(50);
    expect(store.limit).toBe(50);
    expect(store.points).toHaveLength(0);
  });
});

describe('addCapacityPoint', () => {
  it('appends a point immutably', () => {
    const s0 = emptyCapacityStore(100);
    const s1 = addCapacityPoint(s0, 10);
    expect(s1.points).toHaveLength(1);
    expect(s0.points).toHaveLength(0);
    expect(s1.points[0].used).toBe(10);
    expect(s1.points[0].limit).toBe(100);
  });
});

describe('pruneCapacityPoints', () => {
  it('removes points older than maxAge', () => {
    const base = new Date(Date.now() - 10_000);
    let store = emptyCapacityStore(100);
    store = addCapacityPoint(store, 5, base);
    store = addCapacityPoint(store, 10, new Date());
    const pruned = pruneCapacityPoints(store, 5_000);
    expect(pruned.points).toHaveLength(1);
    expect(pruned.points[0].used).toBe(10);
  });
});

describe('buildCapacityForecast', () => {
  it('returns stable with no points', () => {
    const fc = buildCapacityForecast(emptyCapacityStore(100));
    expect(fc.trend).toBe('stable');
    expect(fc.projectedExhaustionDate).toBeNull();
  });

  it('detects growing trend and projects exhaustion', () => {
    const base = new Date(Date.now() - 60_000);
    let store = emptyCapacityStore(100);
    store = addCapacityPoint(store, 20, base);
    store = addCapacityPoint(store, 60, msAfter(base, 60_000));
    const fc = buildCapacityForecast(store);
    expect(fc.trend).toBe('growing');
    expect(fc.projectedExhaustionDate).not.toBeNull();
    expect(fc.currentUsageRate).toBeCloseTo(0.6);
  });

  it('detects shrinking trend', () => {
    const base = new Date(Date.now() - 60_000);
    let store = emptyCapacityStore(100);
    store = addCapacityPoint(store, 80, base);
    store = addCapacityPoint(store, 20, msAfter(base, 60_000));
    const fc = buildCapacityForecast(store);
    expect(fc.trend).toBe('shrinking');
    expect(fc.projectedExhaustionDate).toBeNull();
  });

  it('reports stable when delta is small', () => {
    const base = new Date(Date.now() - 60_000);
    let store = emptyCapacityStore(100);
    store = addCapacityPoint(store, 50, base);
    store = addCapacityPoint(store, 52, msAfter(base, 60_000));
    const fc = buildCapacityForecast(store);
    expect(fc.trend).toBe('stable');
  });
});
