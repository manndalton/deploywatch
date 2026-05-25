import { buildCoverage, summarizeCoverage } from './coverage';
import { HistoryEntry } from './history';

const BASE = new Date('2024-01-01T00:00:00Z').getTime();

function makeEntry(offsetMs: number, duration = 0, status = 'success'): HistoryEntry {
  return {
    id: `e-${offsetMs}`,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    timestamp: new Date(BASE + offsetMs).toISOString(),
    duration,
  } as unknown as HistoryEntry;
}

describe('buildCoverage', () => {
  it('returns one point per bucket', () => {
    const points = buildCoverage([], 60_000, 6, BASE + 60_000);
    expect(points).toHaveLength(6);
  });

  it('counts deploys in each bucket', () => {
    const entries = [
      makeEntry(5_000),
      makeEntry(5_500),
      makeEntry(35_000),
    ];
    const now = BASE + 60_000;
    const points = buildCoverage(entries, 60_000, 6, now);
    // bucket 0: 0-10s -> 2 deploys
    expect(points[0].deployCount).toBe(2);
    // bucket 3: 30-40s -> 1 deploy
    expect(points[3].deployCount).toBe(1);
  });

  it('computes coverage pct from duration', () => {
    const bucketSize = 10_000;
    const entries = [makeEntry(0, bucketSize / 2)];
    const now = BASE + 10_000;
    const points = buildCoverage(entries, 10_000, 1, now);
    expect(points[0].coveragePct).toBeCloseTo(50, 0);
  });

  it('caps coverage at 100%', () => {
    const entries = [makeEntry(0, 20_000)];
    const now = BASE + 10_000;
    const points = buildCoverage(entries, 10_000, 1, now);
    expect(points[0].coveragePct).toBe(100);
  });

  it('handles empty entries', () => {
    const points = buildCoverage([], 60_000, 3, BASE + 60_000);
    points.forEach((p) => {
      expect(p.coveragePct).toBe(0);
      expect(p.deployCount).toBe(0);
    });
  });
});

describe('summarizeCoverage', () => {
  it('returns zeros for empty points', () => {
    const s = summarizeCoverage([]);
    expect(s.coveragePct).toBe(0);
  });

  it('averages coverage across buckets', () => {
    const points = [
      { windowStart: BASE, coveragePct: 50, deployCount: 1 },
      { windowStart: BASE + 10_000, coveragePct: 100, deployCount: 2 },
    ];
    const s = summarizeCoverage(points);
    expect(s.coveragePct).toBe(75);
  });
});
