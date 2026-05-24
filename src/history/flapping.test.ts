import { detectFlapping, FlappingResult } from './flapping';
import { HistoryEntry } from './history';

const BASE = Date.now();

function makeEntry(
  name: string,
  status: string,
  offsetMs: number,
  repo = 'org/repo'
): HistoryEntry {
  return {
    id: `${name}-${offsetMs}`,
    provider: 'github',
    repo,
    name,
    status,
    timestamp: BASE - offsetMs,
    duration: 30000,
    url: 'https://example.com',
  };
}

describe('detectFlapping', () => {
  it('returns empty array for no entries', () => {
    expect(detectFlapping([])).toEqual([]);
  });

  it('detects a flapping deployment', () => {
    const entries: HistoryEntry[] = [
      makeEntry('deploy', 'success', 5000),
      makeEntry('deploy', 'failure', 4000),
      makeEntry('deploy', 'success', 3000),
      makeEntry('deploy', 'failure', 2000),
    ];
    const results = detectFlapping(entries, { threshold: 3 });
    expect(results).toHaveLength(1);
    expect(results[0].isFlapping).toBe(true);
    expect(results[0].transitions).toBe(3);
  });

  it('does not flag stable deployments', () => {
    const entries: HistoryEntry[] = [
      makeEntry('deploy', 'success', 5000),
      makeEntry('deploy', 'success', 4000),
      makeEntry('deploy', 'success', 3000),
    ];
    const results = detectFlapping(entries, { threshold: 3 });
    expect(results[0].isFlapping).toBe(false);
    expect(results[0].transitions).toBe(0);
  });

  it('ignores entries outside the time window', () => {
    const outsideWindow = 2 * 60 * 60 * 1000; // 2 hours ago
    const entries: HistoryEntry[] = [
      makeEntry('deploy', 'success', outsideWindow + 1000),
      makeEntry('deploy', 'failure', outsideWindow + 500),
      makeEntry('deploy', 'success', 1000),
    ];
    const results = detectFlapping(entries, { windowMs: 60 * 60 * 1000, threshold: 2 });
    // Only 1 entry in window, not enough to transition
    expect(results.length === 0 || results[0].transitions < 2).toBe(true);
  });

  it('ignores non-terminal statuses', () => {
    const entries: HistoryEntry[] = [
      makeEntry('deploy', 'in_progress', 3000),
      makeEntry('deploy', 'queued', 2000),
    ];
    const results = detectFlapping(entries);
    expect(results).toHaveLength(0);
  });

  it('groups by provider:repo:name', () => {
    const entries: HistoryEntry[] = [
      makeEntry('ci', 'success', 5000, 'org/a'),
      makeEntry('ci', 'failure', 4000, 'org/a'),
      makeEntry('ci', 'success', 3000, 'org/b'),
      makeEntry('ci', 'failure', 2000, 'org/b'),
    ];
    const results = detectFlapping(entries, { threshold: 1 });
    expect(results).toHaveLength(2);
    expect(results.every(r => r.isFlapping)).toBe(true);
  });

  it('sorts results by transition count descending', () => {
    const entries: HistoryEntry[] = [
      makeEntry('a', 'success', 6000),
      makeEntry('a', 'failure', 5000),
      makeEntry('b', 'success', 4000),
      makeEntry('b', 'failure', 3000),
      makeEntry('b', 'success', 2000),
      makeEntry('b', 'failure', 1000),
    ];
    const results = detectFlapping(entries, { threshold: 1 });
    expect(results[0].transitions).toBeGreaterThanOrEqual(results[1].transitions);
  });
});
