import { HistoryEntry } from './history';

export interface RollbackTarget {
  entryId: string;
  provider: string;
  project: string;
  targetStatus: string;
  triggeredAt: Date;
  reason?: string;
}

export interface RollbackResult {
  success: boolean;
  target: RollbackTarget;
  error?: string;
  completedAt: Date;
}

export interface RollbackStore {
  records: RollbackResult[];
}

export function emptyRollbackStore(): RollbackStore {
  return { records: [] };
}

export function createRollbackTarget(
  entry: HistoryEntry,
  reason?: string
): RollbackTarget {
  return {
    entryId: entry.id,
    provider: entry.provider,
    project: entry.project,
    targetStatus: entry.status,
    triggeredAt: new Date(),
    reason,
  };
}

export function recordRollback(
  store: RollbackStore,
  target: RollbackTarget,
  success: boolean,
  error?: string
): RollbackStore {
  const result: RollbackResult = {
    success,
    target,
    error,
    completedAt: new Date(),
  };
  return { records: [...store.records, result] };
}

export function getRecentRollbacks(
  store: RollbackStore,
  limit = 20
): RollbackResult[] {
  return store.records
    .slice()
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, limit);
}

export function pruneRollbacks(
  store: RollbackStore,
  maxAge: number
): RollbackStore {
  const cutoff = Date.now() - maxAge;
  return {
    records: store.records.filter(
      (r) => r.completedAt.getTime() >= cutoff
    ),
  };
}
