/**
 * Changelog: tracks significant deployment events as human-readable entries.
 */

export interface ChangelogEntry {
  id: string;
  timestamp: number;
  provider: string;
  project: string;
  status: string;
  message: string;
  author?: string;
  ref?: string;
}

export interface ChangelogStore {
  entries: ChangelogEntry[];
}

export function emptyChangelogStore(): ChangelogStore {
  return { entries: [] };
}

let _counter = 0;
export function generateChangelogId(): string {
  return `cl-${Date.now()}-${++_counter}`;
}

export function createChangelogEntry(
  provider: string,
  project: string,
  status: string,
  message: string,
  opts: { author?: string; ref?: string } = {}
): ChangelogEntry {
  return {
    id: generateChangelogId(),
    timestamp: Date.now(),
    provider,
    project,
    status,
    message,
    author: opts.author,
    ref: opts.ref,
  };
}

export function addChangelogEntry(
  store: ChangelogStore,
  entry: ChangelogEntry
): ChangelogStore {
  return { entries: [entry, ...store.entries] };
}

export function getChangelog(
  store: ChangelogStore,
  limit = 50
): ChangelogEntry[] {
  return store.entries.slice(0, limit);
}

export function filterChangelogByProject(
  store: ChangelogStore,
  project: string
): ChangelogEntry[] {
  return store.entries.filter((e) => e.project === project);
}

export function pruneChangelog(
  store: ChangelogStore,
  maxAge: number
): ChangelogStore {
  const cutoff = Date.now() - maxAge;
  return { entries: store.entries.filter((e) => e.timestamp >= cutoff) };
}
