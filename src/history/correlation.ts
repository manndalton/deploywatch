/**
 * Correlation: link related deployment entries across providers.
 */

import { HistoryEntry } from './history';

export interface CorrelationGroup {
  id: string;
  label: string;
  entryIds: string[];
  createdAt: number;
}

export interface CorrelationStore {
  groups: CorrelationGroup[];
}

export function emptyCorrelationStore(): CorrelationStore {
  return { groups: [] };
}

let _seq = 0;
export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${++_seq}`;
}

export function createCorrelationGroup(
  label: string,
  entryIds: string[]
): CorrelationGroup {
  return {
    id: generateCorrelationId(),
    label,
    entryIds: [...entryIds],
    createdAt: Date.now(),
  };
}

export function addCorrelation(
  store: CorrelationStore,
  group: CorrelationGroup
): CorrelationStore {
  return { groups: [...store.groups, group] };
}

export function removeCorrelation(
  store: CorrelationStore,
  id: string
): CorrelationStore {
  return { groups: store.groups.filter((g) => g.id !== id) };
}

export function getCorrelationById(
  store: CorrelationStore,
  id: string
): CorrelationGroup | undefined {
  return store.groups.find((g) => g.id === id);
}

export function findGroupsForEntry(
  store: CorrelationStore,
  entryId: string
): CorrelationGroup[] {
  return store.groups.filter((g) => g.entryIds.includes(entryId));
}

export function resolveCorrelatedEntries(
  store: CorrelationStore,
  groupId: string,
  allEntries: HistoryEntry[]
): HistoryEntry[] {
  const group = getCorrelationById(store, groupId);
  if (!group) return [];
  const idSet = new Set(group.entryIds);
  return allEntries.filter((e) => idSet.has(e.id));
}
