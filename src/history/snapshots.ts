import { randomUUID } from 'crypto';
import type { HistoryEntry } from './history';

export interface Snapshot {
  id: string;
  label?: string;
  createdAt: string;
  entries: HistoryEntry[];
}

export interface SnapshotDiffEntry {
  before: HistoryEntry;
  after: HistoryEntry;
}

export interface SnapshotDiff {
  added: HistoryEntry[];
  removed: HistoryEntry[];
  changed: SnapshotDiffEntry[];
}

export function createSnapshot(entries: HistoryEntry[], label?: string): Snapshot {
  return {
    id: randomUUID(),
    label,
    createdAt: new Date().toISOString(),
    entries: entries.map((e) => ({ ...e })),
  };
}

export function diffSnapshot(a: Snapshot, b: Snapshot): SnapshotDiff {
  const aMap = new Map(a.entries.map((e) => [e.id, e]));
  const bMap = new Map(b.entries.map((e) => [e.id, e]));

  const added: HistoryEntry[] = [];
  const removed: HistoryEntry[] = [];
  const changed: SnapshotDiffEntry[] = [];

  for (const [id, entry] of bMap) {
    if (!aMap.has(id)) {
      added.push(entry);
    } else {
      const before = aMap.get(id)!;
      if (before.status !== entry.status || before.finishedAt !== entry.finishedAt) {
        changed.push({ before, after: entry });
      }
    }
  }

  for (const [id, entry] of aMap) {
    if (!bMap.has(id)) {
      removed.push(entry);
    }
  }

  return { added, removed, changed };
}

export function findSnapshotById(
  snapshots: Snapshot[],
  id: string
): Snapshot | undefined {
  return snapshots.find((s) => s.id === id);
}

export function findSnapshotByLabel(
  snapshots: Snapshot[],
  label: string
): Snapshot | undefined {
  return snapshots.find((s) => s.label === label);
}

export function pruneSnapshots(snapshots: Snapshot[], maxCount: number): Snapshot[] {
  if (snapshots.length <= maxCount) return snapshots;
  return snapshots
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxCount);
}
