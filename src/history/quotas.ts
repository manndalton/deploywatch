import { HistoryEntry } from './history';

export interface QuotaPolicy {
  maxEntriesPerRepo: number;
  maxTotalEntries: number;
  maxAgeDays: number;
}

export interface QuotaViolation {
  kind: 'per-repo' | 'total' | 'age';
  repo?: string;
  count?: number;
  limit: number;
}

export interface QuotaReport {
  violations: QuotaViolation[];
  totalEntries: number;
  repoBreakdown: Record<string, number>;
}

export const defaultQuotaPolicy: QuotaPolicy = {
  maxEntriesPerRepo: 500,
  maxTotalEntries: 5000,
  maxAgeDays: 90,
};

export function evaluateQuotas(
  entries: HistoryEntry[],
  policy: QuotaPolicy = defaultQuotaPolicy
): QuotaReport {
  const now = Date.now();
  const maxAgeMs = policy.maxAgeDays * 24 * 60 * 60 * 1000;
  const violations: QuotaViolation[] = [];
  const repoBreakdown: Record<string, number> = {};

  for (const entry of entries) {
    const key = `${entry.provider}/${entry.repo}`;
    repoBreakdown[key] = (repoBreakdown[key] ?? 0) + 1;
  }

  if (entries.length > policy.maxTotalEntries) {
    violations.push({ kind: 'total', count: entries.length, limit: policy.maxTotalEntries });
  }

  for (const [repo, count] of Object.entries(repoBreakdown)) {
    if (count > policy.maxEntriesPerRepo) {
      violations.push({ kind: 'per-repo', repo, count, limit: policy.maxEntriesPerRepo });
    }
  }

  const oldEntries = entries.filter(e => now - new Date(e.timestamp).getTime() > maxAgeMs);
  if (oldEntries.length > 0) {
    violations.push({ kind: 'age', count: oldEntries.length, limit: policy.maxAgeDays });
  }

  return { violations, totalEntries: entries.length, repoBreakdown };
}

export function enforceQuotas(
  entries: HistoryEntry[],
  policy: QuotaPolicy = defaultQuotaPolicy
): HistoryEntry[] {
  const now = Date.now();
  const maxAgeMs = policy.maxAgeDays * 24 * 60 * 60 * 1000;

  let result = entries.filter(
    e => now - new Date(e.timestamp).getTime() <= maxAgeMs
  );

  const byRepo: Record<string, HistoryEntry[]> = {};
  for (const entry of result) {
    const key = `${entry.provider}/${entry.repo}`;
    (byRepo[key] = byRepo[key] ?? []).push(entry);
  }

  const trimmed: HistoryEntry[] = [];
  for (const group of Object.values(byRepo)) {
    const sorted = [...group].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    trimmed.push(...sorted.slice(0, policy.maxEntriesPerRepo));
  }

  trimmed.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return trimmed.slice(0, policy.maxTotalEntries);
}
