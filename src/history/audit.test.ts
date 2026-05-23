import {
  emptyAuditStore,
  recordAudit,
  getAuditLog,
  pruneAuditLog,
  filterAuditByAction,
  AuditStore,
} from './audit';

function makeStore(...actions: Array<{ action: Parameters<typeof recordAudit>[1]; targetId: string }>): AuditStore {
  let store = emptyAuditStore();
  for (const { action, targetId } of actions) {
    store = recordAudit(store, action, targetId, 'tester');
  }
  return store;
}

describe('emptyAuditStore', () => {
  it('returns a store with no entries', () => {
    expect(emptyAuditStore().entries).toHaveLength(0);
  });
});

describe('recordAudit', () => {
  it('adds an entry to the store', () => {
    const store = recordAudit(emptyAuditStore(), 'annotation.add', 'entry-1', 'alice', 'added note');
    expect(store.entries).toHaveLength(1);
    const e = store.entries[0];
    expect(e.action).toBe('annotation.add');
    expect(e.targetId).toBe('entry-1');
    expect(e.actor).toBe('alice');
    expect(e.detail).toBe('added note');
    expect(e.id).toBeTruthy();
    expect(e.timestamp).toBeTruthy();
  });

  it('does not mutate the original store', () => {
    const original = emptyAuditStore();
    recordAudit(original, 'label.add', 'entry-2', 'bob');
    expect(original.entries).toHaveLength(0);
  });

  it('accumulates multiple entries', () => {
    const store = makeStore(
      { action: 'bookmark.add', targetId: 'e1' },
      { action: 'bookmark.remove', targetId: 'e2' }
    );
    expect(store.entries).toHaveLength(2);
  });
});

describe('getAuditLog', () => {
  it('returns all entries when no targetId given', () => {
    const store = makeStore(
      { action: 'comment.add', targetId: 'e1' },
      { action: 'comment.edit', targetId: 'e2' }
    );
    expect(getAuditLog(store)).toHaveLength(2);
  });

  it('filters by targetId', () => {
    const store = makeStore(
      { action: 'comment.add', targetId: 'e1' },
      { action: 'comment.edit', targetId: 'e2' },
      { action: 'comment.remove', targetId: 'e1' }
    );
    const result = getAuditLog(store, 'e1');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.targetId === 'e1')).toBe(true);
  });
});

describe('pruneAuditLog', () => {
  it('keeps all entries when under the limit', () => {
    const store = makeStore({ action: 'alert.acknowledge', targetId: 'a1' });
    expect(pruneAuditLog(store, 10).entries).toHaveLength(1);
  });

  it('trims oldest entries beyond maxEntries', () => {
    const store = makeStore(
      { action: 'label.add', targetId: 'e1' },
      { action: 'label.add', targetId: 'e2' },
      { action: 'label.add', targetId: 'e3' },
      { action: 'label.add', targetId: 'e4' },
      { action: 'label.add', targetId: 'e5' }
    );
    const pruned = pruneAuditLog(store, 3);
    expect(pruned.entries).toHaveLength(3);
    expect(pruned.entries[0].targetId).toBe('e3');
  });
});

describe('filterAuditByAction', () => {
  it('returns only entries matching the action', () => {
    const store = makeStore(
      { action: 'snapshot.create', targetId: 's1' },
      { action: 'snapshot.prune', targetId: 's2' },
      { action: 'snapshot.create', targetId: 's3' }
    );
    const result = filterAuditByAction(store, 'snapshot.create');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.action === 'snapshot.create')).toBe(true);
  });
});
