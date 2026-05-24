import { describe, it, expect } from 'vitest';
import {
  kMeansClusters,
  buildClusterStore,
  emptyClusterStore,
} from './clustering';
import { HistoryEntry } from './history';

function makeEntry(
  id: string,
  startedAt: string,
  finishedAt: string,
): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    status: 'success',
    startedAt,
    finishedAt,
    createdAt: startedAt,
  } as HistoryEntry;
}

const base = '2024-01-01T00:00:00.000Z';
function msAfter(ms: number) {
  return new Date(new Date(base).getTime() + ms).toISOString();
}

describe('kMeansClusters', () => {
  it('returns empty array for no entries', () => {
    expect(kMeansClusters([], 3)).toEqual([]);
  });

  it('returns k clusters', () => {
    const entries = [
      makeEntry('a', base, msAfter(1000)),
      makeEntry('b', base, msAfter(5000)),
      makeEntry('c', base, msAfter(10000)),
    ];
    const clusters = kMeansClusters(entries, 3);
    expect(clusters).toHaveLength(3);
  });

  it('each entry appears in exactly one cluster', () => {
    const entries = Array.from({ length: 9 }, (_, i) =>
      makeEntry(`e${i}`, base, msAfter((i + 1) * 1000)),
    );
    const clusters = kMeansClusters(entries, 3);
    const allIds = clusters.flatMap((c) => c.entries.map((e) => e.id));
    expect(new Set(allIds).size).toBe(entries.length);
  });

  it('cluster has centroid and spread', () => {
    const entries = [
      makeEntry('x', base, msAfter(2000)),
      makeEntry('y', base, msAfter(3000)),
    ];
    const clusters = kMeansClusters(entries, 2);
    clusters.forEach((c) => {
      expect(typeof c.centroid).toBe('number');
      expect(typeof c.spread).toBe('number');
    });
  });
});

describe('buildClusterStore', () => {
  it('includes generatedAt timestamp', () => {
    const store = buildClusterStore([]);
    expect(store.generatedAt).toBeTruthy();
  });

  it('emptyClusterStore has no clusters', () => {
    const store = emptyClusterStore();
    expect(store.clusters).toHaveLength(0);
  });
});
