import {
  emptyEnvironmentStore,
  addEnvironmentRecord,
  getEnvironmentRecords,
  getRecordsByEntry,
  pruneEnvironmentStore,
  summarizeEnvironments,
} from './environment';

function makeRecord(
  overrides: Partial<{ name: string; entryId: string; provider: string; branch: string }> = {}
) {
  return {
    name: 'production',
    entryId: 'entry-1',
    provider: 'github',
    branch: 'main',
    url: 'https://example.com',
    ...overrides,
  };
}

describe('environment store', () => {
  it('starts empty', () => {
    expect(emptyEnvironmentStore().records).toHaveLength(0);
  });

  it('adds a record and assigns an id', () => {
    const store = addEnvironmentRecord(emptyEnvironmentStore(), makeRecord());
    expect(store.records).toHaveLength(1);
    expect(store.records[0].id).toMatch(/^env-/);
  });

  it('is immutable — original store unchanged', () => {
    const original = emptyEnvironmentStore();
    addEnvironmentRecord(original, makeRecord());
    expect(original.records).toHaveLength(0);
  });

  it('filters by environment name', () => {
    let store = emptyEnvironmentStore();
    store = addEnvironmentRecord(store, makeRecord({ name: 'production' }));
    store = addEnvironmentRecord(store, makeRecord({ name: 'preview' }));
    store = addEnvironmentRecord(store, makeRecord({ name: 'production' }));
    expect(getEnvironmentRecords(store, 'production')).toHaveLength(2);
    expect(getEnvironmentRecords(store, 'preview')).toHaveLength(1);
  });

  it('filters by entry id', () => {
    let store = emptyEnvironmentStore();
    store = addEnvironmentRecord(store, makeRecord({ entryId: 'entry-1' }));
    store = addEnvironmentRecord(store, makeRecord({ entryId: 'entry-2' }));
    expect(getRecordsByEntry(store, 'entry-1')).toHaveLength(1);
    expect(getRecordsByEntry(store, 'entry-99')).toHaveLength(0);
  });

  it('prunes old records', () => {
    let store = emptyEnvironmentStore();
    store = addEnvironmentRecord(store, makeRecord());
    // Manually backdate the record
    store = { records: [{ ...store.records[0], recordedAt: Date.now() - 100_000 }] };
    store = addEnvironmentRecord(store, makeRecord({ name: 'preview' }));
    const pruned = pruneEnvironmentStore(store, 50_000);
    expect(pruned.records).toHaveLength(1);
    expect(pruned.records[0].name).toBe('preview');
  });

  it('summarizes environment counts', () => {
    let store = emptyEnvironmentStore();
    store = addEnvironmentRecord(store, makeRecord({ name: 'production' }));
    store = addEnvironmentRecord(store, makeRecord({ name: 'production' }));
    store = addEnvironmentRecord(store, makeRecord({ name: 'preview' }));
    const summary = summarizeEnvironments(store);
    expect(summary['production']).toBe(2);
    expect(summary['preview']).toBe(1);
  });
});
