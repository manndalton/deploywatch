import { buildTrendPoints, computeTrendDirection, buildTrendSummary } from './trends';
import { HistoryEntry } from './history';

function makeEntry(
  status: 'success' | 'failure' | 'running',
  startedAt: string,
  finishedAt?: string
): HistoryEntry {
  return {
    id: Math.random().toString(36).slice(2),
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    startedAt,
    finishedAt,
  } as HistoryEntry;
}

describe('buildTrendPoints', () => {
  it('returns empty array for no entries', () => {
    expect(buildTrendPoints([])).toEqual([]);
  });

  it('groups entries by day and computes success rate', () => {
    const entries = [
      makeEntry('success', '2024-01-01T10:00:00Z', '2024-01-01T10:05:00Z'),
      makeEntry('failure', '2024-01-01T11:00:00Z', '2024-01-01T11:03:00Z'),
      makeEntry('success', '2024-01-02T09:00:00Z', '2024-01-02T09:04:00Z'),
    ];
    const points = buildTrendPoints(entries);
    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2024-01-01');
    expect(points[0].successRate).toBeCloseTo(0.5);
    expect(points[0].totalRuns).toBe(2);
    expect(points[1].date).toBe('2024-01-02');
    expect(points[1].successRate).toBe(1);
  });

  it('computes average duration in ms', () => {
    const entries = [
      makeEntry('success', '2024-01-01T10:00:00Z', '2024-01-01T10:01:00Z'), // 60000ms
      makeEntry('success', '2024-01-01T11:00:00Z', '2024-01-01T11:02:00Z'), // 120000ms
    ];
    const points = buildTrendPoints(entries);
    expect(points[0].avgDuration).toBeCloseTo(90000);
  });
});

describe('computeTrendDirection', () => {
  it('returns stable for fewer than 2 points', () => {
    expect(computeTrendDirection([])).toBe('stable');
    expect(computeTrendDirection([{ date: '2024-01-01', successRate: 0.8, avgDuration: 0, totalRuns: 1 }])).toBe('stable');
  });

  it('detects improving trend', () => {
    const points = [
      { date: '2024-01-01', successRate: 0.4, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-02', successRate: 0.5, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-03', successRate: 0.9, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-04', successRate: 1.0, avgDuration: 0, totalRuns: 5 },
    ];
    expect(computeTrendDirection(points)).toBe('improving');
  });

  it('detects degrading trend', () => {
    const points = [
      { date: '2024-01-01', successRate: 1.0, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-02', successRate: 0.9, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-03', successRate: 0.5, avgDuration: 0, totalRuns: 5 },
      { date: '2024-01-04', successRate: 0.3, avgDuration: 0, totalRuns: 5 },
    ];
    expect(computeTrendDirection(points)).toBe('degrading');
  });
});

describe('buildTrendSummary', () => {
  it('identifies peak and worst success dates', () => {
    const entries = [
      makeEntry('success', '2024-01-01T10:00:00Z'),
      makeEntry('failure', '2024-01-02T10:00:00Z'),
      makeEntry('failure', '2024-01-02T11:00:00Z'),
    ];
    const summary = buildTrendSummary(entries);
    expect(summary.peakSuccessDate).toBe('2024-01-01');
    expect(summary.worstSuccessDate).toBe('2024-01-02');
  });

  it('returns null dates for empty entries', () => {
    const summary = buildTrendSummary([]);
    expect(summary.peakSuccessDate).toBeNull();
    expect(summary.worstSuccessDate).toBeNull();
    expect(summary.overallDirection).toBe('stable');
  });
});
