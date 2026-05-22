import { describe, it, expect } from 'vitest';
import {
  createSnapshot,
  diffSnapshot,
  findSnapshotById,
  findSnapshotByLabel,
  pruneSnapshots,
  Snapshot,
} from './snapshots';
import { HistoryEntry } from './history';

function makeEntry(id: string, status: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    tags: [],
  } as unknown as HistoryEntry;
}

describe('createSnapshot', () => {
  it('creates a snapshot with a unique id and the given label', () => {
    const entries = [makeEntry('e1', 'success')];
    const snap = createSnapshot('release-1', entries);
    expect(snap.label).toBe('release-1');
    expect(snap.id).toMatch(/^snap_/);
    expect(snap.entries).toHaveLength(1);
    expect(snap.entries[0]).not.toBe(entries[0]); // deep copy
  });
});

describe('diffSnapshot', () => {
  it('detects added entries', () => {
    const a = createSnapshot('a', [makeEntry('e1', 'success')]);
    const b = createSnapshot('b', [makeEntry('e1', 'success'), makeEntry('e2', 'failure')]);
    const { added, removed, changed } = diffSnapshot(a, b);
    expect(added).toHaveLength(1);
    expect(added[0].id).toBe('e2');
    expect(removed).toHaveLength(0);
    expect(changed).toHaveLength(0);
  });

  it('detects removed entries', () => {
    const a = createSnapshot('a', [makeEntry('e1', 'success'), makeEntry('e2', 'success')]);
    const b = createSnapshot('b', [makeEntry('e1', 'success')]);
    const { removed } = diffSnapshot(a, b);
    expect(removed).toHaveLength(1);
    expect(removed[0].id).toBe('e2');
  });

  it('detects changed status', () => {
    const a = createSnapshot('a', [makeEntry('e1', 'success')]);
    const b = createSnapshot('b', [makeEntry('e1', 'failure')]);
    const { changed } = diffSnapshot(a, b);
    expect(changed).toHaveLength(1);
    expect(changed[0].status).toBe('failure');
  });
});

describe('findSnapshotById', () => {
  it('returns the matching snapshot', () => {
    const snap = createSnapshot('test', []);
    expect(findSnapshotById([snap], snap.id)).toBe(snap);
    expect(findSnapshotById([snap], 'missing')).toBeUndefined();
  });
});

describe('findSnapshotByLabel', () => {
  it('returns the matching snapshot by label', () => {
    const snap = createSnapshot('my-label', []);
    expect(findSnapshotByLabel([snap], 'my-label')).toBe(snap);
    expect(findSnapshotByLabel([snap], 'other')).toBeUndefined();
  });
});

describe('pruneSnapshots', () => {
  it('keeps all snapshots when under limit', () => {
    const snaps = [createSnapshot('a', []), createSnapshot('b', [])];
    expect(pruneSnapshots(snaps, 5)).toHaveLength(2);
  });

  it('retains only the most recent snapshots', () => {
    const snaps: Snapshot[] = [
      { id: '1', label: 'old', createdAt: '2024-01-01T00:00:00Z', entries: [] },
      { id: '2', label: 'mid', createdAt: '2024-06-01T00:00:00Z', entries: [] },
      { id: '3', label: 'new', createdAt: '2024-12-01T00:00:00Z', entries: [] },
    ];
    const pruned = pruneSnapshots(snaps, 2);
    expect(pruned).toHaveLength(2);
    expect(pruned.map(s => s.id)).toEqual(['2', '3']);
  });
});
