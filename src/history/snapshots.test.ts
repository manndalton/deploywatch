import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSnapshot,
  diffSnapshot,
  findSnapshotById,
  findSnapshotByLabel,
  pruneSnapshots,
} from './snapshots';
import type { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: '2024-01-01T10:00:00Z',
    finishedAt: '2024-01-01T10:05:00Z',
    durationMs: 300000,
    tags: [],
    annotations: [],
    ...overrides,
  };
}

describe('createSnapshot', () => {
  it('creates a snapshot with an id and timestamp', () => {
    const entries = [makeEntry(), makeEntry({ id: 'entry-2', status: 'failure' })];
    const snap = createSnapshot(entries, 'before-deploy');
    expect(snap.id).toBeTruthy();
    expect(snap.label).toBe('before-deploy');
    expect(snap.entries).toHaveLength(2);
    expect(snap.createdAt).toBeTruthy();
  });

  it('creates a snapshot without a label', () => {
    const snap = createSnapshot([makeEntry()]);
    expect(snap.label).toBeUndefined();
  });
});

describe('diffSnapshot', () => {
  it('detects added entries', () => {
    const a = createSnapshot([makeEntry({ id: 'e1' })]);
    const b = createSnapshot([makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })]);
    const result = diffSnapshot(a, b);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].id).toBe('e2');
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });

  it('detects removed entries', () => {
    const a = createSnapshot([makeEntry({ id: 'e1' }), makeEntry({ id: 'e2' })]);
    const b = createSnapshot([makeEntry({ id: 'e1' })]);
    const result = diffSnapshot(a, b);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].id).toBe('e2');
  });

  it('detects changed entries', () => {
    const a = createSnapshot([makeEntry({ id: 'e1', status: 'in_progress' })]);
    const b = createSnapshot([makeEntry({ id: 'e1', status: 'success' })]);
    const result = diffSnapshot(a, b);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].before.status).toBe('in_progress');
    expect(result.changed[0].after.status).toBe('success');
  });
});

describe('findSnapshotById', () => {
  it('finds a snapshot by id', () => {
    const snaps = [createSnapshot([makeEntry()], 'snap-a'), createSnapshot([makeEntry()], 'snap-b')];
    const found = findSnapshotById(snaps, snaps[1].id);
    expect(found?.label).toBe('snap-b');
  });

  it('returns undefined when not found', () => {
    expect(findSnapshotById([], 'missing')).toBeUndefined();
  });
});

describe('findSnapshotByLabel', () => {
  it('finds a snapshot by label', () => {
    const snaps = [createSnapshot([], 'alpha'), createSnapshot([], 'beta')];
    expect(findSnapshotByLabel(snaps, 'beta')?.label).toBe('beta');
  });
});

describe('pruneSnapshots', () => {
  it('keeps only the most recent N snapshots', () => {
    const snaps = Array.from({ length: 5 }, (_, i) =>
      createSnapshot([], `snap-${i}`)
    );
    const pruned = pruneSnapshots(snaps, 3);
    expect(pruned).toHaveLength(3);
  });

  it('returns all when under limit', () => {
    const snaps = [createSnapshot([])]
    expect(pruneSnapshots(snaps, 10)).toHaveLength(1);
  });
});
