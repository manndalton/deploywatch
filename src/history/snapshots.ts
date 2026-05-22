import { HistoryEntry } from './history';

export interface Snapshot {
  id: string;
  label: string;
  createdAt: string;
  entries: HistoryEntry[];
}

export function createSnapshot(label: string, entries: HistoryEntry[]): Snapshot {
  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    createdAt: new Date().toISOString(),
    entries: entries.map(e => ({ ...e })),
  };
}

export function diffSnapshot(
  a: Snapshot,
  b: Snapshot
): { added: HistoryEntry[]; removed: HistoryEntry[]; changed: HistoryEntry[] } {
  const aMap = new Map(a.entries.map(e => [e.id, e]));
  const bMap = new Map(b.entries.map(e => [e.id, e]));

  const added: HistoryEntry[] = [];
  const removed: HistoryEntry[] = [];
  const changed: HistoryEntry[] = [];

  for (const [id, entry] of bMap) {
    if (!aMap.has(id)) {
      added.push(entry);
    } else if (aMap.get(id)!.status !== entry.status) {
      changed.push(entry);
    }
  }

  for (const [id, entry] of aMap) {
    if (!bMap.has(id)) {
      removed.push(entry);
    }
  }

  return { added, removed, changed };
}

export function findSnapshotById(snapshots: Snapshot[], id: string): Snapshot | undefined {
  return snapshots.find(s => s.id === id);
}

export function findSnapshotByLabel(snapshots: Snapshot[], label: string): Snapshot | undefined {
  return snapshots.find(s => s.label === label);
}

export function pruneSnapshots(snapshots: Snapshot[], maxCount: number): Snapshot[] {
  if (snapshots.length <= maxCount) return snapshots;
  return snapshots
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(snapshots.length - maxCount);
}
