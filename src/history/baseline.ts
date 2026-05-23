import { HistoryEntry } from './history';

export interface Baseline {
  id: string;
  label: string;
  createdAt: number;
  entries: HistoryEntry[];
}

export interface BaselineStore {
  baselines: Baseline[];
}

export function emptyBaselineStore(): BaselineStore {
  return { baselines: [] };
}

export function generateBaselineId(): string {
  return `bl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createBaseline(label: string, entries: HistoryEntry[]): Baseline {
  return {
    id: generateBaselineId(),
    label,
    createdAt: Date.now(),
    entries: entries.slice(),
  };
}

export function addBaseline(store: BaselineStore, baseline: Baseline): BaselineStore {
  return { baselines: [...store.baselines, baseline] };
}

export function removeBaseline(store: BaselineStore, id: string): BaselineStore {
  return { baselines: store.baselines.filter(b => b.id !== id) };
}

export function findBaselineById(store: BaselineStore, id: string): Baseline | undefined {
  return store.baselines.find(b => b.id === id);
}

export function findBaselineByLabel(store: BaselineStore, label: string): Baseline | undefined {
  return store.baselines.find(b => b.label === label);
}

export function compareToBaseline(
  baseline: Baseline,
  current: HistoryEntry[]
): { added: HistoryEntry[]; removed: HistoryEntry[]; changed: HistoryEntry[] } {
  const baselineIds = new Set(baseline.entries.map(e => e.id));
  const currentIds = new Set(current.map(e => e.id));

  const added = current.filter(e => !baselineIds.has(e.id));
  const removed = baseline.entries.filter(e => !currentIds.has(e.id));
  const changed = current.filter(e => {
    if (!baselineIds.has(e.id)) return false;
    const base = baseline.entries.find(b => b.id === e.id);
    return base && base.status !== e.status;
  });

  return { added, removed, changed };
}

export function pruneBaselines(store: BaselineStore, maxCount: number): BaselineStore {
  if (store.baselines.length <= maxCount) return store;
  const sorted = [...store.baselines].sort((a, b) => b.createdAt - a.createdAt);
  return { baselines: sorted.slice(0, maxCount) };
}
