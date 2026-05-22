import { HistoryEntry } from "./history";

export interface Bookmark {
  id: string;
  entryKey: string;
  label: string;
  createdAt: string;
  note?: string;
}

export type BookmarkStore = Record<string, Bookmark>;

export function createBookmark(
  entryKey: string,
  label: string,
  note?: string
): Bookmark {
  return {
    id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    entryKey,
    label,
    createdAt: new Date().toISOString(),
    note,
  };
}

export function addBookmark(
  store: BookmarkStore,
  entry: HistoryEntry,
  label: string,
  note?: string
): BookmarkStore {
  const key = `${entry.provider}:${entry.repo}:${entry.runId}`;
  const bookmark = createBookmark(key, label, note);
  return { ...store, [bookmark.id]: bookmark };
}

export function removeBookmark(
  store: BookmarkStore,
  bookmarkId: string
): BookmarkStore {
  const next = { ...store };
  delete next[bookmarkId];
  return next;
}

export function listBookmarks(store: BookmarkStore): Bookmark[] {
  return Object.values(store).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function findBookmarkByEntry(
  store: BookmarkStore,
  entryKey: string
): Bookmark | undefined {
  return Object.values(store).find((b) => b.entryKey === entryKey);
}

export function updateBookmarkNote(
  store: BookmarkStore,
  bookmarkId: string,
  note: string
): BookmarkStore {
  if (!store[bookmarkId]) return store;
  return {
    ...store,
    [bookmarkId]: { ...store[bookmarkId], note },
  };
}
