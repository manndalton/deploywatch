import { describe, it, expect } from 'vitest';
import {
  defaultPolicies,
  matchPolicy,
  evaluateSla,
  SlaPolicy,
} from './sla';
import { HistoryEntry } from './history';

const base = new Date('2024-01-01T12:00:00Z');

function makeEntry(
  overrides: Partial<HistoryEntry> & { durationMin?: number }
): HistoryEntry {
  const { durationMin = 3, ...rest } = overrides;
  const startedAt = base.toISOString();
  const finishedAt = new Date(
    base.getTime() + durationMin * 60 * 1000
  ).toISOString();
  return {
    id: 'e1',
    provider: 'github',
    project: 'my-app',
    branch: 'main',
    status: 'success',
    startedAt,
    finishedAt,
    createdAt: startedAt,
    tags: [],
    ...rest,
  };
}

describe('defaultPolicies', () => {
  it('returns at least one policy', () => {
    expect(defaultPolicies().length).toBeGreaterThan(0);
  });
});

describe('matchPolicy', () => {
  const policies = defaultPolicies();

  it('matches a provider-scoped policy', () => {
    const entry = makeEntry({ provider: 'vercel' });
    const p = matchPolicy(entry, policies);
    expect(p?.name).toBe('Fast');
  });

  it('falls back to generic policy for github', () => {
    const entry = makeEntry({ provider: 'github' });
    const p = matchPolicy(entry, policies);
    expect(p?.name).toBe('Standard');
  });
});

describe('evaluateSla', () => {
  const policies: SlaPolicy[] = [
    { name: 'Quick', maxDurationMs: 2 * 60 * 1000 },
  ];

  it('marks a fast deployment as compliant', () => {
    const entry = makeEntry({ durationMin: 1 });
    const summary = evaluateSla([entry], policies);
    expect(summary.breached).toBe(0);
    expect(summary.compliance).toBe(1);
  });

  it('marks a slow deployment as breached', () => {
    const entry = makeEntry({ durationMin: 5 });
    const summary = evaluateSla([entry], policies);
    expect(summary.breached).toBe(1);
    expect(summary.results[0].overageMs).toBe(3 * 60 * 1000);
  });

  it('skips entries without timing data', () => {
    const entry = makeEntry({});
    (entry as any).startedAt = undefined;
    const summary = evaluateSla([entry], policies);
    expect(summary.total).toBe(0);
  });

  it('computes compliance ratio correctly', () => {
    const fast = makeEntry({ id: 'a', durationMin: 1 });
    const slow = makeEntry({ id: 'b', durationMin: 5 });
    const summary = evaluateSla([fast, slow], policies);
    expect(summary.compliance).toBeCloseTo(0.5);
  });
});
