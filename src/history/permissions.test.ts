import {
  emptyPermissionStore,
  grantPermission,
  revokePermission,
  getPermissions,
  hasPermission,
  filterEntriesByPermission,
} from './permissions';
import { HistoryEntry } from './history';

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'acme/app',
    branch: 'main',
    status: 'success',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    tags: [],
  };
}

describe('permissions', () => {
  it('starts empty', () => {
    const store = emptyPermissionStore();
    expect(store.permissions).toHaveLength(0);
  });

  it('grants a permission', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'viewer', '*');
    expect(store.permissions).toHaveLength(1);
    expect(store.permissions[0].principal).toBe('alice');
    expect(store.permissions[0].role).toBe('viewer');
  });

  it('upgrades an existing permission', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'viewer', '*');
    store = grantPermission(store, 'alice', 'admin', '*');
    expect(store.permissions).toHaveLength(1);
    expect(store.permissions[0].role).toBe('admin');
  });

  it('revokes a permission', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'editor', '*');
    store = revokePermission(store, 'alice', '*');
    expect(store.permissions).toHaveLength(0);
  });

  it('returns permissions for a principal', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'viewer', 'entry:1');
    store = grantPermission(store, 'bob', 'admin', '*');
    expect(getPermissions(store, 'alice')).toHaveLength(1);
    expect(getPermissions(store, 'bob')).toHaveLength(1);
  });

  it('checks wildcard permission satisfies any resource', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'editor', '*');
    expect(hasPermission(store, 'alice', 'editor', 'entry:42')).toBe(true);
    expect(hasPermission(store, 'alice', 'admin', 'entry:42')).toBe(false);
  });

  it('checks resource-specific permission', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'viewer', 'entry:1');
    expect(hasPermission(store, 'alice', 'viewer', 'entry:1')).toBe(true);
    expect(hasPermission(store, 'alice', 'viewer', 'entry:2')).toBe(false);
  });

  it('filters entries by permission', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'alice', 'viewer', 'entry:a');
    const entries = [makeEntry('a'), makeEntry('b')];
    const filtered = filterEntriesByPermission(store, 'alice', entries);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('a');
  });

  it('returns all entries for wildcard viewer', () => {
    let store = emptyPermissionStore();
    store = grantPermission(store, 'admin', 'admin', '*');
    const entries = [makeEntry('x'), makeEntry('y'), makeEntry('z')];
    expect(filterEntriesByPermission(store, 'admin', entries)).toHaveLength(3);
  });
});
