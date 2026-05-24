import {
  emptyRunbookStore,
  addRunbook,
  removeRunbook,
  updateRunbook,
  getRunbooks,
  findRunbookById,
} from './runbook';

describe('runbook store', () => {
  it('starts empty', () => {
    expect(emptyRunbookStore().entries).toHaveLength(0);
  });

  it('adds a runbook entry', () => {
    const store = addRunbook(emptyRunbookStore(), 'repo/main', 'Incident Guide', 'https://wiki/incident');
    expect(store.entries).toHaveLength(1);
    const e = store.entries[0];
    expect(e.entryKey).toBe('repo/main');
    expect(e.title).toBe('Incident Guide');
    expect(e.url).toBe('https://wiki/incident');
    expect(e.id).toBeTruthy();
  });

  it('removes a runbook entry by id', () => {
    let store = addRunbook(emptyRunbookStore(), 'repo/main', 'Guide', 'https://wiki/guide');
    const id = store.entries[0].id;
    store = removeRunbook(store, id);
    expect(store.entries).toHaveLength(0);
  });

  it('updates title and url', () => {
    let store = addRunbook(emptyRunbookStore(), 'repo/main', 'Old Title', 'https://old');
    const id = store.entries[0].id;
    store = updateRunbook(store, id, { title: 'New Title', url: 'https://new' });
    const e = store.entries[0];
    expect(e.title).toBe('New Title');
    expect(e.url).toBe('https://new');
    expect(e.updatedAt >= e.createdAt).toBe(true);
  });

  it('retrieves runbooks by entryKey', () => {
    let store = addRunbook(emptyRunbookStore(), 'repo/main', 'A', 'https://a');
    store = addRunbook(store, 'repo/dev', 'B', 'https://b');
    store = addRunbook(store, 'repo/main', 'C', 'https://c');
    const results = getRunbooks(store, 'repo/main');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.title)).toEqual(['A', 'C']);
  });

  it('finds runbook by id', () => {
    const store = addRunbook(emptyRunbookStore(), 'repo/main', 'Guide', 'https://guide');
    const id = store.entries[0].id;
    expect(findRunbookById(store, id)?.title).toBe('Guide');
    expect(findRunbookById(store, 'missing')).toBeUndefined();
  });

  it('does not mutate original store on add', () => {
    const original = emptyRunbookStore();
    addRunbook(original, 'k', 't', 'u');
    expect(original.entries).toHaveLength(0);
  });
});
