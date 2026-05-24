/**
 * Runbook links — associate runbook URLs with deployment entries by key.
 */

export interface RunbookEntry {
  id: string;
  entryKey: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunbookStore {
  entries: RunbookEntry[];
}

export function emptyRunbookStore(): RunbookStore {
  return { entries: [] };
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function addRunbook(
  store: RunbookStore,
  entryKey: string,
  title: string,
  url: string
): RunbookStore {
  const now = new Date().toISOString();
  const entry: RunbookEntry = { id: generateId(), entryKey, title, url, createdAt: now, updatedAt: now };
  return { entries: [...store.entries, entry] };
}

export function removeRunbook(store: RunbookStore, id: string): RunbookStore {
  return { entries: store.entries.filter(e => e.id !== id) };
}

export function updateRunbook(
  store: RunbookStore,
  id: string,
  patch: Partial<Pick<RunbookEntry, 'title' | 'url'>>
): RunbookStore {
  return {
    entries: store.entries.map(e =>
      e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
    ),
  };
}

export function getRunbooks(store: RunbookStore, entryKey: string): RunbookEntry[] {
  return store.entries.filter(e => e.entryKey === entryKey);
}

export function findRunbookById(store: RunbookStore, id: string): RunbookEntry | undefined {
  return store.entries.find(e => e.id === id);
}
