/**
 * Tag management for history entries.
 * Allows entries to be annotated with arbitrary string tags
 * and queried by one or more tags.
 */

import { HistoryEntry } from "./history";

export type TagMap = Record<string, string[]>;

/**
 * Return all unique tags across the given entries.
 */
export function collectTags(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      set.add(tag);
    }
  }
  return Array.from(set).sort();
}

/**
 * Filter entries that contain ALL of the specified tags.
 */
export function filterByTags(
  entries: HistoryEntry[],
  tags: string[]
): HistoryEntry[] {
  if (tags.length === 0) return entries;
  return entries.filter((e) =>
    tags.every((t) => (e.tags ?? []).includes(t))
  );
}

/**
 * Add a tag to an entry (returns a new entry, does not mutate).
 */
export function addTag(entry: HistoryEntry, tag: string): HistoryEntry {
  const existing = entry.tags ?? [];
  if (existing.includes(tag)) return entry;
  return { ...entry, tags: [...existing, tag] };
}

/**
 * Remove a tag from an entry (returns a new entry, does not mutate).
 */
export function removeTag(entry: HistoryEntry, tag: string): HistoryEntry {
  return { ...entry, tags: (entry.tags ?? []).filter((t) => t !== tag) };
}

/**
 * Build a map from tag → list of entry ids for quick look-up.
 */
export function buildTagIndex(entries: HistoryEntry[]): TagMap {
  const map: TagMap = {};
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      if (!map[tag]) map[tag] = [];
      map[tag].push(entry.id);
    }
  }
  return map;
}
