import { HistoryEntry } from './history';

export interface Comment {
  id: string;
  entryKey: string;
  author: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export type CommentsStore = Record<string, Comment[]>;

export function createComment(
  entryKey: string,
  author: string,
  body: string
): Comment {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entryKey,
    author,
    body: body.trim(),
    createdAt: now,
  };
}

export function addComment(
  store: CommentsStore,
  entryKey: string,
  author: string,
  body: string
): CommentsStore {
  const comment = createComment(entryKey, author, body);
  const existing = store[entryKey] ?? [];
  return { ...store, [entryKey]: [...existing, comment] };
}

export function editComment(
  store: CommentsStore,
  entryKey: string,
  commentId: string,
  newBody: string
): CommentsStore {
  const existing = store[entryKey] ?? [];
  const updated = existing.map((c) =>
    c.id === commentId
      ? { ...c, body: newBody.trim(), updatedAt: new Date().toISOString() }
      : c
  );
  return { ...store, [entryKey]: updated };
}

export function removeComment(
  store: CommentsStore,
  entryKey: string,
  commentId: string
): CommentsStore {
  const existing = store[entryKey] ?? [];
  const filtered = existing.filter((c) => c.id !== commentId);
  if (filtered.length === 0) {
    const next = { ...store };
    delete next[entryKey];
    return next;
  }
  return { ...store, [entryKey]: filtered };
}

export function getComments(store: CommentsStore, entryKey: string): Comment[] {
  return store[entryKey] ?? [];
}

export function pruneComments(
  store: CommentsStore,
  activeKeys: Set<string>
): CommentsStore {
  return Object.fromEntries(
    Object.entries(store).filter(([key]) => activeKeys.has(key))
  );
}
