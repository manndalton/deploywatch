import {
  emptyWatchlistStore,
  addWatchlistItem,
  removeWatchlistItem,
  getWatchlistItems,
  isWatched,
  filterEntriesByWatchlist,
} from './watchlist';
import { HistoryEntry } from './history';

function makeEntry(repo: string, environment = 'production'): HistoryEntry {
  return {
    id: `e_${Math.random().toString(36).slice(2)}`,
    repo,
    environment,
    status: 'success',
    startedAt: Date.now() - 60000,
    finishedAt: Date.now(),
    branch: 'main',
    commit: 'abc1234',
    provider: 'github',
  };
}

describe('watchlist', () => {
  it('starts empty', () => {
    const store = emptyWatchlistStore();
    expect(store.items).toHaveLength(0);
  });

  it('adds an item', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/repo', 'production', 'Prod');
    expect(store.items).toHaveLength(1);
    expect(store.items[0].repo).toBe('org/repo');
    expect(store.items[0].label).toBe('Prod');
  });

  it('does not add duplicate', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/repo', 'production');
    store = addWatchlistItem(store, 'org/repo', 'production');
    expect(store.items).toHaveLength(1);
  });

  it('removes an item', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/repo', 'production');
    const id = store.items[0].id;
    store = removeWatchlistItem(store, id);
    expect(store.items).toHaveLength(0);
  });

  it('checks isWatched', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/repo', 'staging');
    expect(isWatched(store, 'org/repo', 'staging')).toBe(true);
    expect(isWatched(store, 'org/repo', 'production')).toBe(false);
  });

  it('filters entries by watchlist', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/alpha', 'production');
    const entries = [
      makeEntry('org/alpha', 'production'),
      makeEntry('org/beta', 'production'),
      makeEntry('org/alpha', 'staging'),
    ];
    const filtered = filterEntriesByWatchlist(entries, store);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].repo).toBe('org/alpha');
  });

  it('returns all entries when watchlist is empty', () => {
    const store = emptyWatchlistStore();
    const entries = [makeEntry('org/alpha'), makeEntry('org/beta')];
    expect(filterEntriesByWatchlist(entries, store)).toHaveLength(2);
  });

  it('getWatchlistItems returns sorted by addedAt', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/a');
    store = addWatchlistItem(store, 'org/b');
    const items = getWatchlistItems(store);
    expect(items[0].repo).toBe('org/a');
  });
});
