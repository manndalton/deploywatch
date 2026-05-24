import {
  estimateCost,
  buildCostPoints,
  aggregateCosts,
  CostPoint,
} from './costtracking';
import { HistoryEntry } from './history';

const BASE = 1_700_000_000_000;

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: BASE,
    durationMs: 60_000,
    ...overrides,
  } as HistoryEntry;
}

describe('estimateCost', () => {
  it('computes cost for github at known rate', () => {
    // 60 s * 0.008 = 0.48
    expect(estimateCost('github', 60_000)).toBeCloseTo(0.48, 4);
  });

  it('uses default rate for unknown provider', () => {
    expect(estimateCost('unknown', 10_000)).toBeCloseTo(0.06, 4);
  });

  it('returns 0 for zero duration', () => {
    expect(estimateCost('vercel', 0)).toBe(0);
  });
});

describe('buildCostPoints', () => {
  it('maps entries to cost points', () => {
    const entries = [
      makeEntry({ id: 'a', provider: 'github', durationMs: 60_000 }),
      makeEntry({ id: 'b', provider: 'vercel', durationMs: 30_000 }),
    ];
    const pts = buildCostPoints(entries);
    expect(pts).toHaveLength(2);
    expect(pts[0].provider).toBe('github');
    expect(pts[1].costUsd).toBeCloseTo(0.15, 4);
  });

  it('skips entries without durationMs', () => {
    const entries = [
      makeEntry({ id: 'a', durationMs: undefined }),
      makeEntry({ id: 'b', durationMs: 0 }),
      makeEntry({ id: 'c', durationMs: 5_000 }),
    ];
    expect(buildCostPoints(entries)).toHaveLength(1);
  });
});

describe('aggregateCosts', () => {
  const now = BASE + 10_000_000;
  const points: CostPoint[] = [
    { entryId: '1', provider: 'github', deployedAt: now - 1000, costUsd: 0.48, durationMs: 60000 },
    { entryId: '2', provider: 'github', deployedAt: now - 2000, costUsd: 0.24, durationMs: 30000 },
    { entryId: '3', provider: 'vercel', deployedAt: now - 500, costUsd: 0.15, durationMs: 30000 },
    { entryId: '4', provider: 'github', deployedAt: now - 9_000_000, costUsd: 1.0, durationMs: 125000 },
  ];

  it('sums costs within the window', () => {
    const summaries = aggregateCosts(points, 5_000, now);
    const gh = summaries.find(s => s.provider === 'github')!;
    expect(gh.totalCostUsd).toBeCloseTo(0.72, 4);
    expect(gh.count).toBe(2);
  });

  it('excludes points outside the window', () => {
    const summaries = aggregateCosts(points, 5_000, now);
    const gh = summaries.find(s => s.provider === 'github')!;
    expect(gh.count).toBe(2); // entry 4 is outside window
  });

  it('returns summaries sorted by total cost descending', () => {
    const summaries = aggregateCosts(points, 5_000, now);
    expect(summaries[0].totalCostUsd).toBeGreaterThanOrEqual(summaries[summaries.length - 1].totalCostUsd);
  });

  it('returns empty array when no points in window', () => {
    expect(aggregateCosts(points, 100, now)).toEqual([]);
  });
});
