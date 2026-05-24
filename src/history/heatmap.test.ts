import { buildHeatmap, heatIntensity, peakHour, DAY_LABELS } from './heatmap';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'e1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    timestamp: new Date('2024-03-04T14:00:00Z').toISOString(), // Monday 14:00 UTC
    duration: 60,
    tags: [],
    ...overrides,
  };
}

describe('buildHeatmap', () => {
  it('returns a 7x24 grid of cells', () => {
    const { cells } = buildHeatmap([]);
    expect(cells).toHaveLength(7);
    cells.forEach(row => expect(row).toHaveLength(24));
  });

  it('increments count for the correct day/hour bucket', () => {
    const entry = makeEntry({ timestamp: new Date('2024-03-04T14:30:00Z').toISOString() });
    const { cells } = buildHeatmap([entry]);
    const d = new Date(entry.timestamp);
    expect(cells[d.getDay()][d.getHours()].count).toBe(1);
  });

  it('increments failures for failure status', () => {
    const entry = makeEntry({
      status: 'failure',
      timestamp: new Date('2024-03-04T10:00:00Z').toISOString(),
    });
    const { cells } = buildHeatmap([entry]);
    const d = new Date(entry.timestamp);
    expect(cells[d.getDay()][d.getHours()].failures).toBe(1);
  });

  it('does not increment failures for success', () => {
    const entry = makeEntry({ status: 'success' });
    const { cells } = buildHeatmap([entry]);
    const d = new Date(entry.timestamp);
    expect(cells[d.getDay()][d.getHours()].failures).toBe(0);
  });

  it('sets maxCount correctly', () => {
    const ts = new Date('2024-03-04T14:00:00Z').toISOString();
    const entries = [makeEntry({ timestamp: ts }), makeEntry({ timestamp: ts })];
    const { maxCount } = buildHeatmap(entries);
    expect(maxCount).toBe(2);
  });
});

describe('heatIntensity', () => {
  it('returns 0 when maxCount is 0', () => {
    expect(heatIntensity({ hour: 0, day: 0, count: 0, failures: 0 }, 0)).toBe(0);
  });

  it('returns 4 for a full cell', () => {
    expect(heatIntensity({ hour: 0, day: 0, count: 10, failures: 0 }, 10)).toBe(4);
  });

  it('returns proportional value', () => {
    expect(heatIntensity({ hour: 0, day: 0, count: 5, failures: 0 }, 10)).toBe(2);
  });
});

describe('peakHour', () => {
  it('returns null for empty data', () => {
    const data = buildHeatmap([]);
    expect(peakHour(data)).toBeNull();
  });

  it('returns the cell with the highest count', () => {
    const ts = new Date('2024-03-04T09:00:00Z').toISOString();
    const entries = [makeEntry({ timestamp: ts }), makeEntry({ timestamp: ts })];
    const data = buildHeatmap(entries);
    const peak = peakHour(data);
    const d = new Date(ts);
    expect(peak).not.toBeNull();
    expect(peak!.day).toBe(d.getDay());
    expect(peak!.hour).toBe(d.getHours());
  });
});

describe('DAY_LABELS', () => {
  it('has 7 entries starting with Sun', () => {
    expect(DAY_LABELS).toHaveLength(7);
    expect(DAY_LABELS[0]).toBe('Sun');
    expect(DAY_LABELS[6]).toBe('Sat');
  });
});
