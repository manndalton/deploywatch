/**
 * SLA (Service Level Agreement) tracking for deployments.
 * Tracks whether deployments complete within defined time budgets.
 */

import { HistoryEntry } from './history';

export interface SlaPolicy {
  name: string;
  maxDurationMs: number;
  applyToProviders?: string[];
}

export interface SlaResult {
  entry: HistoryEntry;
  policy: SlaPolicy;
  durationMs: number;
  breached: boolean;
  overageMs: number;
}

export interface SlaSummary {
  total: number;
  breached: number;
  compliance: number; // 0–1
  results: SlaResult[];
}

export function defaultPolicies(): SlaPolicy[] {
  return [
    { name: 'Standard', maxDurationMs: 5 * 60 * 1000 },
    { name: 'Fast', maxDurationMs: 2 * 60 * 1000, applyToProviders: ['vercel'] },
  ];
}

export function matchPolicy(
  entry: HistoryEntry,
  policies: SlaPolicy[]
): SlaPolicy | undefined {
  return policies.find(
    (p) =>
      !p.applyToProviders ||
      p.applyToProviders.includes(entry.provider.toLowerCase())
  );
}

export function evaluateSla(
  entries: HistoryEntry[],
  policies: SlaPolicy[]
): SlaSummary {
  const results: SlaResult[] = [];

  for (const entry of entries) {
    if (!entry.startedAt || !entry.finishedAt) continue;
    const policy = matchPolicy(entry, policies);
    if (!policy) continue;

    const durationMs =
      new Date(entry.finishedAt).getTime() -
      new Date(entry.startedAt).getTime();
    const breached = durationMs > policy.maxDurationMs;
    const overageMs = breached ? durationMs - policy.maxDurationMs : 0;

    results.push({ entry, policy, durationMs, breached, overageMs });
  }

  const breached = results.filter((r) => r.breached).length;
  const compliance = results.length === 0 ? 1 : (results.length - breached) / results.length;

  return { total: results.length, breached, compliance, results };
}
