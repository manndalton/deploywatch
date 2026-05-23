import { replayHistory, filterByTimeRange, ReplayFrame } from './replay';
import { HistoryEntry } from './history';

function makeEntry(id: string, timestamp: string, status = 'success'): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    timestamp,
    duration: 60,
    tags: [],
  } as unknown as HistoryEntry;
}

describe('filterByTimeRange', () => {
  const entries = [
    makeEntry('a', '2024-01-01T00:00:00Z'),
    makeEntry('b', '2024-01-02T00:00:00Z'),
    makeEntry('c', '2024-01-03T00:00:00Z'),
  ];

  it('returns all entries when no bounds given', () => {
    expect(filterByTimeRange(entries)).toHaveLength(3);
  });

  it('filters by from', () => {
    const result = filterByTimeRange(entries, new Date('2024-01-02T00:00:00Z'));
    expect(result.map((e) => e.id)).toEqual(['b', 'c']);
  });

  it('filters by to', () => {
    const result = filterByTimeRange(entries, undefined, new Date('2024-01-02T00:00:00Z'));
    expect(result.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('filters by both bounds', () => {
    const result = filterByTimeRange(
      entries,
      new Date('2024-01-01T12:00:00Z'),
      new Date('2024-01-02T12:00:00Z')
    );
    expect(result.map((e) => e.id)).toEqual(['b']);
  });
});

describe('replayHistory', () => {
  it('calls callback for each entry in order', async () => {
    const entries = [
      makeEntry('b', '2024-01-02T00:00:00Z'),
      makeEntry('a', '2024-01-01T00:00:00Z'),
    ];
    const frames: ReplayFrame[] = [];
    await replayHistory(entries, (f) => { frames.push(f); }, { speedMultiplier: 0 });
    expect(frames).toHaveLength(2);
    expect(frames[0].entry.id).toBe('a');
    expect(frames[1].entry.id).toBe('b');
  });

  it('sets correct index and total', async () => {
    const entries = [
      makeEntry('a', '2024-01-01T00:00:00Z'),
      makeEntry('b', '2024-01-02T00:00:00Z'),
      makeEntry('c', '2024-01-03T00:00:00Z'),
    ];
    const frames: ReplayFrame[] = [];
    await replayHistory(entries, (f) => { frames.push(f); }, { speedMultiplier: 0 });
    expect(frames[0].index).toBe(0);
    expect(frames[2].index).toBe(2);
    expect(frames[0].total).toBe(3);
  });

  it('resolves immediately for empty entries', async () => {
    const frames: ReplayFrame[] = [];
    await replayHistory([], (f) => { frames.push(f); });
    expect(frames).toHaveLength(0);
  });
});
