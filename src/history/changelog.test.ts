import {
  emptyChangelogStore,
  createChangelogEntry,
  addChangelogEntry,
  getChangelog,
  filterChangelogByProject,
  pruneChangelog,
} from './changelog';

function makeEntry(project: string, status = 'success', msBefore = 0) {
  const e = createChangelogEntry('github', project, status, `Deploy of ${project}`, {
    author: 'alice',
    ref: 'main',
  });
  return { ...e, timestamp: Date.now() - msBefore };
}

describe('changelog', () => {
  test('emptyChangelogStore returns empty entries', () => {
    expect(emptyChangelogStore().entries).toHaveLength(0);
  });

  test('createChangelogEntry sets required fields', () => {
    const e = createChangelogEntry('vercel', 'my-app', 'failure', 'Deploy failed');
    expect(e.provider).toBe('vercel');
    expect(e.project).toBe('my-app');
    expect(e.status).toBe('failure');
    expect(e.message).toBe('Deploy failed');
    expect(e.id).toMatch(/^cl-/);
  });

  test('createChangelogEntry sets optional fields', () => {
    const e = createChangelogEntry('github', 'api', 'success', 'ok', {
      author: 'bob',
      ref: 'feat/x',
    });
    expect(e.author).toBe('bob');
    expect(e.ref).toBe('feat/x');
  });

  test('addChangelogEntry prepends to store', () => {
    let store = emptyChangelogStore();
    const e1 = makeEntry('app-a');
    const e2 = makeEntry('app-b');
    store = addChangelogEntry(store, e1);
    store = addChangelogEntry(store, e2);
    expect(store.entries[0].project).toBe('app-b');
    expect(store.entries[1].project).toBe('app-a');
  });

  test('getChangelog respects limit', () => {
    let store = emptyChangelogStore();
    for (let i = 0; i < 10; i++) {
      store = addChangelogEntry(store, makeEntry(`proj-${i}`));
    }
    expect(getChangelog(store, 3)).toHaveLength(3);
  });

  test('filterChangelogByProject returns matching entries', () => {
    let store = emptyChangelogStore();
    store = addChangelogEntry(store, makeEntry('alpha'));
    store = addChangelogEntry(store, makeEntry('beta'));
    store = addChangelogEntry(store, makeEntry('alpha'));
    const result = filterChangelogByProject(store, 'alpha');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.project === 'alpha')).toBe(true);
  });

  test('pruneChangelog removes old entries', () => {
    let store = emptyChangelogStore();
    store = addChangelogEntry(store, makeEntry('old', 'success', 10_000));
    store = addChangelogEntry(store, makeEntry('new', 'success', 100));
    const pruned = pruneChangelog(store, 5_000);
    expect(pruned.entries).toHaveLength(1);
    expect(pruned.entries[0].project).toBe('new');
  });
});
