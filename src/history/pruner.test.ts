import { pruneEntries, entryKey, pruneHistory } from './pruner';
import { HistoryEntry } from './history';
import * as historyModule from './history';

const NOW = 1_700_000_000_000;

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    provider: 'github',
    repo: 'org/repo',
    name: 'CI',
    status: 'success',
    timestamp: new Date(NOW).toISOString(),
    url: 'https://github.com/org/repo/actions/runs/1',
    ...overrides,
  };
}

describe('entryKey', () => {
  it('returns provider:repo:name', () => {
    const entry = makeEntry();
    expect(entryKey(entry)).toBe('github:org/repo:CI');
  });
});

describe('pruneEntries', () => {
  beforeAll(() => jest.spyOn(Date, 'now').mockReturnValue(NOW));
  afterAll(() => jest.restoreAllMocks());

  it('removes entries older than maxAgeMs', () => {
    const old = makeEntry({
      timestamp: new Date(NOW - 8 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recent = makeEntry();
    const result = pruneEntries([old, recent], { maxAgeMs: 7 * 24 * 60 * 60 * 1000 });
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(recent.timestamp);
  });

  it('caps entries per key to maxEntriesPerKey', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ timestamp: new Date(NOW - i * 1000).toISOString() })
    );
    const result = pruneEntries(entries, { maxEntriesPerKey: 3, maxAgeMs: Infinity });
    expect(result).toHaveLength(3);
  });

  it('keeps newest entries when capping', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ timestamp: new Date(NOW - i * 60_000).toISOString(), name: `run-${i}` })
    );
    const result = pruneEntries(entries, { maxEntriesPerKey: 2, maxAgeMs: Infinity });
    // newest two: run-0 and run-1
    const names = result.map((e) => e.name).sort();
    expect(names).toEqual(['run-0', 'run-1']);
  });

  it('handles entries from multiple keys independently', () => {
    const a = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ name: 'A', timestamp: new Date(NOW - i * 1000).toISOString() })
    );
    const b = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ name: 'B', timestamp: new Date(NOW - i * 1000).toISOString() })
    );
    const result = pruneEntries([...a, ...b], { maxEntriesPerKey: 2, maxAgeMs: Infinity });
    expect(result).toHaveLength(4);
  });

  it('returns all entries when none exceed limits', () => {
    const entries = [makeEntry(), makeEntry({ name: 'Deploy' })];
    const result = pruneEntries(entries, { maxEntriesPerKey: 10, maxAgeMs: Infinity });
    expect(result).toHaveLength(2);
  });
});

describe('pruneHistory', () => {
  it('saves pruned entries and returns removed count', async () => {
    const old = makeEntry({
      timestamp: new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recent = makeEntry();
    jest.spyOn(historyModule, 'loadHistory').mockResolvedValue([old, recent]);
    const saveSpy = jest.spyOn(historyModule, 'saveHistory').mockResolvedValue();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    const removed = await pruneHistory('/tmp/history.json');
    expect(removed).toBe(1);
    expect(saveSpy).toHaveBeenCalledWith('/tmp/history.json', [recent]);

    jest.restoreAllMocks();
  });

  it('does not save when nothing was pruned', async () => {
    jest.spyOn(historyModule, 'loadHistory').mockResolvedValue([makeEntry()]);
    const saveSpy = jest.spyOn(historyModule, 'saveHistory').mockResolvedValue();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    await pruneHistory('/tmp/history.json');
    expect(saveSpy).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
