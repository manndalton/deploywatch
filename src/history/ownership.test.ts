import {
  emptyOwnershipStore,
  assignOwner,
  removeOwner,
  getOwners,
  findEntriesByOwner,
  findEntriesByTeam,
} from './ownership';

const KEY = 'repo/main#42';

describe('assignOwner', () => {
  it('adds an owner to an empty store', () => {
    const store = assignOwner(emptyOwnershipStore(), KEY, {
      name: 'Alice',
      email: 'alice@example.com',
      team: 'platform',
    });
    const owners = getOwners(store, KEY);
    expect(owners).toHaveLength(1);
    expect(owners[0].name).toBe('Alice');
    expect(owners[0].id).toMatch(/^owner-/);
  });

  it('appends a second owner', () => {
    let store = emptyOwnershipStore();
    store = assignOwner(store, KEY, { name: 'Alice' });
    store = assignOwner(store, KEY, { name: 'Bob', team: 'backend' });
    expect(getOwners(store, KEY)).toHaveLength(2);
  });

  it('does not mutate the original store', () => {
    const original = emptyOwnershipStore();
    assignOwner(original, KEY, { name: 'Alice' });
    expect(original.records).toEqual({});
  });
});

describe('removeOwner', () => {
  it('removes an owner by id', () => {
    let store = emptyOwnershipStore();
    store = assignOwner(store, KEY, { name: 'Alice' });
    const ownerId = getOwners(store, KEY)[0].id;
    store = removeOwner(store, KEY, ownerId);
    expect(getOwners(store, KEY)).toHaveLength(0);
    expect(store.records[KEY]).toBeUndefined();
  });

  it('is a no-op for unknown entry key', () => {
    const store = emptyOwnershipStore();
    expect(removeOwner(store, 'nope', 'id-1')).toEqual(store);
  });
});

describe('findEntriesByOwner', () => {
  it('returns keys where the owner is assigned', () => {
    let store = emptyOwnershipStore();
    store = assignOwner(store, 'key-a', { name: 'Alice' });
    store = assignOwner(store, 'key-b', { name: 'Bob' });
    const aliceId = getOwners(store, 'key-a')[0].id;
    expect(findEntriesByOwner(store, aliceId)).toEqual(['key-a']);
  });
});

describe('findEntriesByTeam', () => {
  it('returns keys where any owner belongs to the team', () => {
    let store = emptyOwnershipStore();
    store = assignOwner(store, 'key-a', { name: 'Alice', team: 'platform' });
    store = assignOwner(store, 'key-b', { name: 'Bob', team: 'backend' });
    store = assignOwner(store, 'key-c', { name: 'Carol', team: 'platform' });
    expect(findEntriesByTeam(store, 'platform').sort()).toEqual(['key-a', 'key-c']);
  });
});
