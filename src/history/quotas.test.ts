import { evaluateQuotas, enforceQuotas, defaultQuotaPolicy, QuotaPolicy } from './quotas';
import { HistoryEntry } from './history';

function makeEntry(repo: string, daysAgo: number, id = Math.random().toString(36).slice(2)): HistoryEntry {
  const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { id, provider: 'github', repo, status: 'success', timestamp, branch: 'main', commit: 'abc' } as HistoryEntry;
}

describe('evaluateQuotas', () => {
  it('returns no violations for a small, recent dataset', () => {
    const entries = [makeEntry('org/repo', 1), makeEntry('org/repo', 2)];
    const report = evaluateQuotas(entries, { maxEntriesPerRepo: 10, maxTotalEntries: 100, maxAgeDays: 30 });
    expect(report.violations).toHaveLength(0);
    expect(report.totalEntries).toBe(2);
  });

  it('detects total entry violation', () => {
    const entries = Array.from({ length: 6 }, (_, i) => makeEntry('org/repo', 1, `id${i}`));
    const report = evaluateQuotas(entries, { maxEntriesPerRepo: 100, maxTotalEntries: 5, maxAgeDays: 30 });
    const v = report.violations.find(v => v.kind === 'total');
    expect(v).toBeDefined();
    expect(v!.count).toBe(6);
  });

  it('detects per-repo violation', () => {
    const entries = Array.from({ length: 4 }, (_, i) => makeEntry('org/repo', 1, `id${i}`));
    const report = evaluateQuotas(entries, { maxEntriesPerRepo: 3, maxTotalEntries: 100, maxAgeDays: 30 });
    const v = report.violations.find(v => v.kind === 'per-repo');
    expect(v).toBeDefined();
    expect(v!.repo).toBe('github/org/repo');
  });

  it('detects age violation', () => {
    const entries = [makeEntry('org/repo', 1), makeEntry('org/repo', 45)];
    const report = evaluateQuotas(entries, { maxEntriesPerRepo: 100, maxTotalEntries: 100, maxAgeDays: 30 });
    const v = report.violations.find(v => v.kind === 'age');
    expect(v).toBeDefined();
    expect(v!.count).toBe(1);
  });

  it('populates repoBreakdown correctly', () => {
    const entries = [makeEntry('org/a', 1), makeEntry('org/a', 2), makeEntry('org/b', 1)];
    const report = evaluateQuotas(entries);
    expect(report.repoBreakdown['github/org/a']).toBe(2);
    expect(report.repoBreakdown['github/org/b']).toBe(1);
  });
});

describe('enforceQuotas', () => {
  it('removes entries older than maxAgeDays', () => {
    const entries = [makeEntry('org/repo', 5), makeEntry('org/repo', 100)];
    const result = enforceQuotas(entries, { ...defaultQuotaPolicy, maxAgeDays: 30 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(entries[0].id);
  });

  it('trims per-repo entries keeping most recent', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry('org/repo', i + 1, `id${i}`)
    );
    const result = enforceQuotas(entries, { maxEntriesPerRepo: 3, maxTotalEntries: 100, maxAgeDays: 90 });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('id0');
  });

  it('trims total entries', () => {
    const entries = Array.from({ length: 10 }, (_, i) => makeEntry('org/repo', i + 1, `id${i}`));
    const result = enforceQuotas(entries, { maxEntriesPerRepo: 100, maxTotalEntries: 4, maxAgeDays: 90 });
    expect(result).toHaveLength(4);
  });

  it('returns empty array for empty input', () => {
    expect(enforceQuotas([])).toEqual([]);
  });
});
