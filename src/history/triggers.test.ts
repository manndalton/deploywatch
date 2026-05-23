import {
  emptyTriggerStore,
  createTrigger,
  addTrigger,
  removeTrigger,
  getTriggersForEntry,
  groupByType,
  pruneTriggers,
  Trigger,
} from './triggers';

function makeTrigger(entryId: string, overrides: Partial<Trigger> = {}): Trigger {
  return createTrigger(entryId, 'push', { actor: 'alice', ref: 'refs/heads/main', ...overrides });
}

describe('triggers', () => {
  it('starts empty', () => {
    expect(emptyTriggerStore().triggers).toHaveLength(0);
  });

  it('creates trigger with defaults', () => {
    const t = createTrigger('e1', 'manual', { actor: 'bob' });
    expect(t.entryId).toBe('e1');
    expect(t.type).toBe('manual');
    expect(t.actor).toBe('bob');
    expect(t.id).toMatch(/^trg_/);
  });

  it('adds a trigger', () => {
    let store = emptyTriggerStore();
    const t = makeTrigger('e1');
    store = addTrigger(store, t);
    expect(store.triggers).toHaveLength(1);
  });

  it('removes a trigger by id', () => {
    let store = emptyTriggerStore();
    const t = makeTrigger('e1');
    store = addTrigger(store, t);
    store = removeTrigger(store, t.id);
    expect(store.triggers).toHaveLength(0);
  });

  it('gets triggers for a specific entry', () => {
    let store = emptyTriggerStore();
    store = addTrigger(store, makeTrigger('e1'));
    store = addTrigger(store, makeTrigger('e2'));
    store = addTrigger(store, makeTrigger('e1'));
    expect(getTriggersForEntry(store, 'e1')).toHaveLength(2);
    expect(getTriggersForEntry(store, 'e2')).toHaveLength(1);
  });

  it('groups by type', () => {
    let store = emptyTriggerStore();
    store = addTrigger(store, createTrigger('e1', 'push'));
    store = addTrigger(store, createTrigger('e2', 'pr'));
    store = addTrigger(store, createTrigger('e3', 'push'));
    const grouped = groupByType(store);
    expect(grouped.push).toHaveLength(2);
    expect(grouped.pr).toHaveLength(1);
    expect(grouped.manual).toHaveLength(0);
  });

  it('prunes old triggers', () => {
    const now = Date.now();
    let store = emptyTriggerStore();
    const old = { ...makeTrigger('e1'), createdAt: now - 10000 };
    const fresh = { ...makeTrigger('e2'), createdAt: now };
    store = addTrigger(store, old);
    store = addTrigger(store, fresh);
    const pruned = pruneTriggers(store, now - 5000);
    expect(pruned.triggers).toHaveLength(1);
    expect(pruned.triggers[0].entryId).toBe('e2');
  });
});
