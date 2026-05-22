import { HistoryEntry, loadHistory, saveHistory } from './history';

export interface PruneOptions {
  /** Maximum number of entries to retain per deployment key (provider:repo:name) */
  maxEntriesPerKey?: number;
  /** Maximum age in milliseconds; entries older than this are dropped */
  maxAgeMs?: number;
}

const DEFAULT_MAX_ENTRIES_PER_KEY = 50;
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Returns a stable grouping key for a history entry.
 */
export function entryKey(entry: HistoryEntry): string {
  return `${entry.provider}:${entry.repo}:${entry.name}`;
}

/**
 * Prunes a list of history entries in-memory according to the given options.
 * Entries are sorted newest-first within each key before applying the cap.
 */
export function pruneEntries(
  entries: HistoryEntry[],
  options: PruneOptions = {}
): HistoryEntry[] {
  const maxEntries = options.maxEntriesPerKey ?? DEFAULT_MAX_ENTRIES_PER_KEY;
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const cutoff = Date.now() - maxAgeMs;

  // Filter by age first
  const fresh = entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);

  // Group by key
  const groups = new Map<string, HistoryEntry[]>();
  for (const entry of fresh) {
    const key = entryKey(entry);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  // Sort each group newest-first and cap
  const result: HistoryEntry[] = [];
  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    result.push(...group.slice(0, maxEntries));
  }

  return result;
}

/**
 * Loads history from disk, prunes it, and writes the result back.
 * Returns the number of entries removed.
 */
export async function pruneHistory(
  filePath: string,
  options: PruneOptions = {}
): Promise<number> {
  const before = await loadHistory(filePath);
  const after = pruneEntries(before, options);
  if (after.length < before.length) {
    await saveHistory(filePath, after);
  }
  return before.length - after.length;
}
