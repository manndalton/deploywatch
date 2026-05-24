export interface OncallEntry {
  id: string;
  name: string;
  email: string;
  startTs: number;
  endTs: number;
  timezone: string;
  tags: string[];
}

export interface OncallStore {
  entries: OncallEntry[];
}

export function emptyOncallStore(): OncallStore {
  return { entries: [] };
}

let _idCounter = 1;
export function generateOncallId(): string {
  return `oncall-${Date.now()}-${_idCounter++}`;
}

export function addOncallEntry(
  store: OncallStore,
  entry: Omit<OncallEntry, 'id'>
): OncallStore {
  const newEntry: OncallEntry = { id: generateOncallId(), ...entry };
  return { entries: [...store.entries, newEntry] };
}

export function removeOncallEntry(
  store: OncallStore,
  id: string
): OncallStore {
  return { entries: store.entries.filter((e) => e.id !== id) };
}

export function getCurrentOncall(
  store: OncallStore,
  now: number = Date.now()
): OncallEntry | undefined {
  return store.entries.find((e) => e.startTs <= now && e.endTs > now);
}

export function getUpcomingOncall(
  store: OncallStore,
  now: number = Date.now(),
  limit = 5
): OncallEntry[] {
  return store.entries
    .filter((e) => e.startTs > now)
    .sort((a, b) => a.startTs - b.startTs)
    .slice(0, limit);
}

export function pruneOncall(
  store: OncallStore,
  now: number = Date.now()
): OncallStore {
  return { entries: store.entries.filter((e) => e.endTs > now - 7 * 24 * 3600 * 1000) };
}
