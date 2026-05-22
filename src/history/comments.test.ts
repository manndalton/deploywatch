import {
  addComment,
  editComment,
  removeComment,
  getComments,
  pruneComments,
  CommentsStore,
} from './comments';

const ENTRY_KEY = 'github:my-repo:main:abc123';

function emptyStore(): CommentsStore {
  return {};
}

describe('addComment', () => {
  it('adds a comment to an empty store', () => {
    const store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'Looks good!');
    const comments = getComments(store, ENTRY_KEY);
    expect(comments).toHaveLength(1);
    expect(comments[0].author).toBe('alice');
    expect(comments[0].body).toBe('Looks good!');
    expect(comments[0].id).toBeTruthy();
  });

  it('appends multiple comments', () => {
    let store = emptyStore();
    store = addComment(store, ENTRY_KEY, 'alice', 'First');
    store = addComment(store, ENTRY_KEY, 'bob', 'Second');
    expect(getComments(store, ENTRY_KEY)).toHaveLength(2);
  });

  it('trims whitespace from body', () => {
    const store = addComment(emptyStore(), ENTRY_KEY, 'alice', '  trimmed  ');
    expect(getComments(store, ENTRY_KEY)[0].body).toBe('trimmed');
  });
});

describe('editComment', () => {
  it('updates the body and sets updatedAt', () => {
    let store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'Original');
    const id = getComments(store, ENTRY_KEY)[0].id;
    store = editComment(store, ENTRY_KEY, id, 'Updated');
    const comment = getComments(store, ENTRY_KEY)[0];
    expect(comment.body).toBe('Updated');
    expect(comment.updatedAt).toBeTruthy();
  });

  it('leaves other comments unchanged', () => {
    let store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'A');
    store = addComment(store, ENTRY_KEY, 'bob', 'B');
    const idA = getComments(store, ENTRY_KEY)[0].id;
    store = editComment(store, ENTRY_KEY, idA, 'A edited');
    expect(getComments(store, ENTRY_KEY)[1].body).toBe('B');
  });
});

describe('removeComment', () => {
  it('removes a comment by id', () => {
    let store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'Hello');
    const id = getComments(store, ENTRY_KEY)[0].id;
    store = removeComment(store, ENTRY_KEY, id);
    expect(getComments(store, ENTRY_KEY)).toHaveLength(0);
  });

  it('removes the entry key when last comment is deleted', () => {
    let store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'Hello');
    const id = getComments(store, ENTRY_KEY)[0].id;
    store = removeComment(store, ENTRY_KEY, id);
    expect(Object.keys(store)).not.toContain(ENTRY_KEY);
  });
});

describe('pruneComments', () => {
  it('removes entries not in the active key set', () => {
    let store = addComment(emptyStore(), ENTRY_KEY, 'alice', 'Hello');
    store = addComment(store, 'stale:key', 'bob', 'Old');
    const pruned = pruneComments(store, new Set([ENTRY_KEY]));
    expect(Object.keys(pruned)).toEqual([ENTRY_KEY]);
  });
});
