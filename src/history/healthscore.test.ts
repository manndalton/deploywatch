import { computeHealthScore, computeAllHealthScores, gradeFromScore } from './healthscore';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'e1',
    provider: 'github',
    name: 'build',
    status: 'success',
    startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    finishedAt: new Date('2024-01-01T10:02:00Z').toISOString(),
    ...overrides,
  };
}

describe('gradeFromScore', () => {
  it('returns A for 90+', () => expect(gradeFromScore(95)).toBe('A'));
  it('returns B for 75–89', () => expect(gradeFromScore(80)).toBe('B'));
  it('returns C for 60–74', () => expect(gradeFromScore(65)).toBe('C'));
  it('returns D for 45–59', () => expect(gradeFromScore(50)).toBe('D'));
  it('returns F below 45', () => expect(gradeFromScore(30)).toBe('F'));
});

describe('computeHealthScore', () => {
  it('returns zero score for empty entries', () => {
    const result = computeHealthScore('github/build', []);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.sampleSize).toBe(0);
  });

  it('scores high for all successes', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({ id: `e${i}`, status: 'success' })
    );
    const result = computeHealthScore('github/build', entries);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.successRate).toBe(1);
    expect(result.sampleSize).toBe(20);
  });

  it('scores low for all failures', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `e${i}`, status: 'failure' })
    );
    const result = computeHealthScore('github/build', entries);
    expect(result.score).toBeLessThan(45);
  });

  it('sets key on result', () => {
    const result = computeHealthScore('vercel/web', [makeEntry()]);
    expect(result.key).toBe('vercel/web');
  });
});

describe('computeAllHealthScores', () => {
  it('groups by provider/name and returns sorted results', () => {
    const entries = [
      makeEntry({ id: 'a1', provider: 'github', name: 'build', status: 'success' }),
      makeEntry({ id: 'a2', provider: 'github', name: 'build', status: 'failure' }),
      makeEntry({ id: 'b1', provider: 'vercel', name: 'web', status: 'success' }),
    ];
    const scores = computeAllHealthScores(entries);
    expect(scores).toHaveLength(2);
    // sorted ascending by score
    expect(scores[0].score).toBeLessThanOrEqual(scores[1].score);
  });

  it('returns empty array for no entries', () => {
    expect(computeAllHealthScores([])).toEqual([]);
  });
});
