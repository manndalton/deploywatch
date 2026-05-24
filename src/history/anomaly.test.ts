import {
  computeMean,
  computeStdDev,
  zScore,
  severityFromZScore,
  detectAnomalies,
  AnomalyResult,
} from './anomaly';
import { HistoryEntry } from './history';

function makeEntry(id: string, duration: number): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    duration,
    timestamp: new Date().toISOString(),
  } as HistoryEntry;
}

describe('computeMean', () => {
  it('returns 0 for empty array', () => {
    expect(computeMean([])).toBe(0);
  });

  it('computes mean correctly', () => {
    expect(computeMean([2, 4, 6])).toBe(4);
  });
});

describe('computeStdDev', () => {
  it('returns 0 for fewer than 2 values', () => {
    expect(computeStdDev([5], 5)).toBe(0);
  });

  it('computes sample std dev', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const mean = computeMean(values);
    const sd = computeStdDev(values, mean);
    expect(sd).toBeCloseTo(2.0, 1);
  });
});

describe('zScore', () => {
  it('returns 0 when stdDev is 0', () => {
    expect(zScore(5, 5, 0)).toBe(0);
  });

  it('computes z-score', () => {
    expect(zScore(10, 5, 5)).toBe(1);
  });
});

describe('severityFromZScore', () => {
  it('returns low for z < 2', () => {
    expect(severityFromZScore(1.5)).toBe('low');
  });

  it('returns medium for 2 <= z < 3', () => {
    expect(severityFromZScore(2.5)).toBe('medium');
  });

  it('returns high for z >= 3', () => {
    expect(severityFromZScore(3.5)).toBe('high');
  });
});

describe('detectAnomalies', () => {
  it('returns empty array for no entries', () => {
    expect(detectAnomalies([])).toEqual([]);
  });

  it('detects outlier entries', () => {
    const entries = [
      makeEntry('a', 10),
      makeEntry('b', 12),
      makeEntry('c', 11),
      makeEntry('d', 10),
      makeEntry('e', 100), // outlier
    ];
    const results = detectAnomalies(entries);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].entryId).toBe('e');
    expect(results[0].field).toBe('duration');
    expect(['medium', 'high']).toContain(results[0].severity);
  });

  it('skips entries with no duration', () => {
    const entries = [makeEntry('a', 0), makeEntry('b', 0)];
    expect(detectAnomalies(entries)).toEqual([]);
  });
});
