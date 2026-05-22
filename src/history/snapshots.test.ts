import { createSnapshot, diffSnapshot, findSnapshotById, findSnapshotByLabel, pruneSnapshots } from './snapshots';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    finishedAt: new Date('2024-01-01T10:05:00Z').toISOString(),
    durationMs: 300000,
    tags: [],
    ...overrides,
  };
}

describe('createSnapshot', () => {
  it('creates a snapshot with a generated id and timestamp', () => {
    const entries = [makeEntry(), makeEntry({ id: 'entry-2', status: 'failure' })];
    const snap = createSnapshot(entries, 'before-release');
    expect(snap.id).toMatch(/^snap-/);
    expect(snap.label).toBe('before-release');
    expect(snap.entries).toHaveLength(2);
    expect(snap.createdAt).toBeDefined();
  });

  it('creates a snapshot without a label', () => {
    const snap = createSnapshot([makeEntry()]);
    expect(snap.label).toBeUndefined();
  });
});

describe('diffSnapshot', () => {
  it('detects added entries', () => {
    const base = createSnapshot([makeEntry()]);
    const current = [makeEntry(), makeEntry({ id: 'entry-2' })];
    const result = diffSnapshot(base, current);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].id).toBe('entry-2');
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });

  it('detects removed entries', () => {
    const base = createSnapshot([makeEntry(), makeEntry({ id: 'entry-2' })]);
    const current = [makeEntry()];
    const result = diffSnapshot(base, current);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].id).toBe('entry-2');
  });

  it('detects changed entries', () => {
    const base = createSnapshot([makeEntry({ status: 'in_progress' })]);
    const current = [makeEntry({ status: 'success' })];
    const result = diffSnapshot(base, current);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].before.status).toBe('in_progress');
    expect(result.changed[0].after.status).toBe('success');
  });
});

describe('findSnapshotById', () => {
  it('finds a snapshot by id', () => {
    const snaps = [createSnapshot([makeEntry()], 'a'), createSnapshot([makeEntry()], 'b')];
    const found = findSnapshotById(snaps, snaps[1].id);
    expect(found?.label).toBe('b');
  });

  it('returns undefined when not found', () => {
    expect(findSnapshotById([], 'missing')).toBeUndefined();
  });
});

describe('findSnapshotByLabel', () => {
  it('finds a snapshot by label', () => {
    const snaps = [createSnapshot([makeEntry()], 'release-1'), createSnapshot([makeEntry()], 'release-2')];
    expect(findSnapshotByLabel(snaps, 'release-1')?.label).toBe('release-1');
  });
});

describe('pruneSnapshots', () => {
  it('keeps only the most recent N snapshots', () => {
    const snaps = Array.from({ length: 5 }, (_, i) =>
      createSnapshot([makeEntry()], `snap-${i}`)
    );
    const pruned = pruneSnapshots(snaps, 3);
    expect(pruned).toHaveLength(3);
  });
});
