/**
 * Labels: lightweight string tags attached to history entries,
 * distinct from structured tags — labels are free-form and user-defined.
 */

export interface LabelStore {
  /** map of entryId -> label list */
  entries: Record<string, string[]>;
}

export function emptyLabelStore(): LabelStore {
  return { entries: {} };
}

export function addLabel(
  store: LabelStore,
  entryId: string,
  label: string
): LabelStore {
  const trimmed = label.trim();
  if (!trimmed) return store;
  const existing = store.entries[entryId] ?? [];
  if (existing.includes(trimmed)) return store;
  return {
    entries: {
      ...store.entries,
      [entryId]: [...existing, trimmed],
    },
  };
}

export function removeLabel(
  store: LabelStore,
  entryId: string,
  label: string
): LabelStore {
  const existing = store.entries[entryId] ?? [];
  const updated = existing.filter((l) => l !== label);
  const entries = { ...store.entries };
  if (updated.length === 0) {
    delete entries[entryId];
  } else {
    entries[entryId] = updated;
  }
  return { entries };
}

export function getLabels(store: LabelStore, entryId: string): string[] {
  return store.entries[entryId] ?? [];
}

export function filterByLabel(
  store: LabelStore,
  label: string
): string[] {
  return Object.entries(store.entries)
    .filter(([, labels]) => labels.includes(label))
    .map(([id]) => id);
}

export function allLabels(store: LabelStore): string[] {
  const set = new Set<string>();
  for (const labels of Object.values(store.entries)) {
    for (const l of labels) set.add(l);
  }
  return Array.from(set).sort();
}

export function pruneLabels(
  store: LabelStore,
  keepIds: Set<string>
): LabelStore {
  const entries: Record<string, string[]> = {};
  for (const [id, labels] of Object.entries(store.entries)) {
    if (keepIds.has(id)) entries[id] = labels;
  }
  return { entries };
}
