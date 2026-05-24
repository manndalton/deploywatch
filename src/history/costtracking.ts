/**
 * Cost tracking: associate a cost estimate with each deployment entry
 * and aggregate spend over time windows.
 */

import { HistoryEntry } from './history';

export interface CostPoint {
  entryId: string;
  provider: string;
  deployedAt: number;
  costUsd: number;
  durationMs: number;
}

export interface CostSummary {
  provider: string;
  totalCostUsd: number;
  avgCostUsd: number;
  count: number;
  windowMs: number;
}

/** Estimate cost from duration using a simple per-second rate (provider-specific). */
const RATE_PER_SECOND: Record<string, number> = {
  github: 0.008,   // ~$0.008 per compute-second
  vercel: 0.005,
  default: 0.006,
};

export function estimateCost(provider: string, durationMs: number): number {
  const rate = RATE_PER_SECOND[provider] ?? RATE_PER_SECOND.default;
  const seconds = durationMs / 1000;
  return parseFloat((rate * seconds).toFixed(4));
}

export function buildCostPoints(entries: HistoryEntry[]): CostPoint[] {
  return entries
    .filter(e => e.durationMs !== undefined && e.durationMs > 0)
    .map(e => ({
      entryId: e.id,
      provider: e.provider,
      deployedAt: e.startedAt,
      costUsd: estimateCost(e.provider, e.durationMs!),
      durationMs: e.durationMs!,
    }));
}

export function aggregateCosts(
  points: CostPoint[],
  windowMs: number,
  now = Date.now(),
): CostSummary[] {
  const cutoff = now - windowMs;
  const recent = points.filter(p => p.deployedAt >= cutoff);

  const byProvider = new Map<string, CostPoint[]>();
  for (const p of recent) {
    const list = byProvider.get(p.provider) ?? [];
    list.push(p);
    byProvider.set(p.provider, list);
  }

  const summaries: CostSummary[] = [];
  for (const [provider, pts] of byProvider) {
    const total = pts.reduce((s, p) => s + p.costUsd, 0);
    summaries.push({
      provider,
      totalCostUsd: parseFloat(total.toFixed(4)),
      avgCostUsd: parseFloat((total / pts.length).toFixed(4)),
      count: pts.length,
      windowMs,
    });
  }
  return summaries.sort((a, b) => b.totalCostUsd - a.totalCostUsd);
}
