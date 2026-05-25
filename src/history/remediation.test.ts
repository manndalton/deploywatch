import {
  emptyRemediationStore,
  createRemediation,
  addRemediation,
  updateRemediationStatus,
  getRemediationsForEntry,
  pruneRemediation,
} from './remediation';

function makeAction(entryKey = 'repo/main', title = 'Fix it', desc = 'Do the thing') {
  return createRemediation(entryKey, title, desc, 'alice');
}

describe('createRemediation', () => {
  it('creates action with pending status', () => {
    const a = makeAction();
    expect(a.status).toBe('pending');
    expect(a.title).toBe('Fix it');
    expect(a.assignee).toBe('alice');
    expect(a.id).toMatch(/^rem-/);
  });
});

describe('addRemediation', () => {
  it('appends action to store', () => {
    let store = emptyRemediationStore();
    store = addRemediation(store, makeAction());
    expect(store.actions).toHaveLength(1);
  });

  it('does not mutate original store', () => {
    const store = emptyRemediationStore();
    addRemediation(store, makeAction());
    expect(store.actions).toHaveLength(0);
  });
});

describe('updateRemediationStatus', () => {
  it('updates status of matching action', () => {
    let store = emptyRemediationStore();
    const action = makeAction();
    store = addRemediation(store, action);
    store = updateRemediationStatus(store, action.id, 'resolved');
    expect(store.actions[0].status).toBe('resolved');
    expect(store.actions[0].resolvedAt).toBeDefined();
  });

  it('ignores unknown ids', () => {
    let store = emptyRemediationStore();
    store = addRemediation(store, makeAction());
    const updated = updateRemediationStatus(store, 'no-such-id', 'dismissed');
    expect(updated.actions[0].status).toBe('pending');
  });
});

describe('getRemediationsForEntry', () => {
  it('filters by entryKey', () => {
    let store = emptyRemediationStore();
    store = addRemediation(store, makeAction('repo/main'));
    store = addRemediation(store, makeAction('repo/dev'));
    const results = getRemediationsForEntry(store, 'repo/main');
    expect(results).toHaveLength(1);
    expect(results[0].entryKey).toBe('repo/main');
  });
});

describe('pruneRemediation', () => {
  it('removes old resolved actions', () => {
    let store = emptyRemediationStore();
    const old = { ...makeAction(), status: 'resolved' as const, updatedAt: Date.now() - 100_000 };
    const fresh = makeAction();
    store = addRemediation(store, old);
    store = addRemediation(store, fresh);
    const pruned = pruneRemediation(store, 50_000);
    expect(pruned.actions).toHaveLength(1);
    expect(pruned.actions[0].id).toBe(fresh.id);
  });

  it('keeps pending actions regardless of age', () => {
    let store = emptyRemediationStore();
    const old = { ...makeAction(), updatedAt: Date.now() - 100_000 };
    store = addRemediation(store, old);
    const pruned = pruneRemediation(store, 50_000);
    expect(pruned.actions).toHaveLength(1);
  });
});
