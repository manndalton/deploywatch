import { HistoryEntry } from './history';

export interface WatchlistItem {
  id: string;
  repo: string;
  environment?: string;
  label?: string;
  addedAt: number;
}

export interface WatchlistStore {
  items: WatchlistItem[];
}

export function emptyWatchlistStore(): WatchlistStore {
  return { items: [] };
}

export function generateWatchlistId(): string {
  return `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addWatchlistItem(
  store: WatchlistStore,
  repo: string,
  environment?: string,
  label?: string
): WatchlistStore {
  const existing = store.items.find(
    (i) => i.repo === repo && i.environment === environment
  );
  if (existing) return store;
  const item: WatchlistItem = {
    id: generateWatchlistId(),
    repo,
    environment,
    label,
    addedAt: Date.now(),
  };
  return { items: [...store.items, item] };
}

export function removeWatchlistItem(
  store: WatchlistStore,
  id: string
): WatchlistStore {
  return { items: store.items.filter((i) => i.id !== id) };
}

export function getWatchlistItems(store: WatchlistStore): WatchlistItem[] {
  return [...store.items].sort((a, b) => a.addedAt - b.addedAt);
}

export function isWatched(
  store: WatchlistStore,
  repo: string,
  environment?: string
): boolean {
  return store.items.some(
    (i) => i.repo === repo && i.environment === environment
  );
}

export function filterEntriesByWatchlist(
  entries: HistoryEntry[],
  store: WatchlistStore
): HistoryEntry[] {
  if (store.items.length === 0) return entries;
  return entries.filter((e) =>
    store.items.some(
      (i) =>
        i.repo === e.repo &&
        (i.environment === undefined || i.environment === e.environment)
    )
  );
}
