import {
  emptyRollbackStore,
  createRollbackTarget,
  recordRollback,
  getRecentRollbacks,
  pruneRollbacks,
} from './rollback';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    project: 'my-app',
    status: 'success',
    branch: 'main',
    commit: 'abc123',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    duration: 90,
    ...overrides,
  };
}

describe('rollback', () => {
  it('emptyRollbackStore returns empty records', () => {
    expect(emptyRollbackStore().records).toHaveLength(0);
  });

  it('createRollbackTarget maps entry fields', () => {
    const entry = makeEntry();
    const target = createRollbackTarget(entry, 'bad deploy');
    expect(target.entryId).toBe('entry-1');
    expect(target.provider).toBe('github');
    expect(target.project).toBe('my-app');
    expect(target.targetStatus).toBe('success');
    expect(target.reason).toBe('bad deploy');
    expect(target.triggeredAt).toBeInstanceOf(Date);
  });

  it('recordRollback appends a success result', () => {
    const store = emptyRollbackStore();
    const target = createRollbackTarget(makeEntry());
    const updated = recordRollback(store, target, true);
    expect(updated.records).toHaveLength(1);
    expect(updated.records[0].success).toBe(true);
    expect(updated.records[0].error).toBeUndefined();
  });

  it('recordRollback appends a failure result with error', () => {
    const store = emptyRollbackStore();
    const target = createRollbackTarget(makeEntry());
    const updated = recordRollback(store, target, false, 'timeout');
    expect(updated.records[0].success).toBe(false);
    expect(updated.records[0].error).toBe('timeout');
  });

  it('getRecentRollbacks returns sorted by completedAt desc', () => {
    let store = emptyRollbackStore();
    store = recordRollback(store, createRollbackTarget(makeEntry({ id: 'a' })), true);
    store = recordRollback(store, createRollbackTarget(makeEntry({ id: 'b' })), false);
    const recent = getRecentRollbacks(store, 10);
    expect(recent[0].completedAt.getTime()).toBeGreaterThanOrEqual(
      recent[1].completedAt.getTime()
    );
  });

  it('pruneRollbacks removes old entries', () => {
    let store = emptyRollbackStore();
    const target = createRollbackTarget(makeEntry());
    store = recordRollback(store, target, true);
    // prune everything older than 0ms — all records should be removed
    const pruned = pruneRollbacks(store, 0);
    expect(pruned.records).toHaveLength(0);
  });

  it('pruneRollbacks keeps recent entries', () => {
    let store = emptyRollbackStore();
    store = recordRollback(store, createRollbackTarget(makeEntry()), true);
    const pruned = pruneRollbacks(store, 60_000);
    expect(pruned.records).toHaveLength(1);
  });
});
