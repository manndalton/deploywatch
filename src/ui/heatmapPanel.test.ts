import { buildHeatmap } from '../history/heatmap';
import { intensityChar, renderHeatmapPanel } from './heatmapPanel';
import { HistoryEntry } from '../history/history';

function makeEntry(ts: number, status = 'success'): HistoryEntry {
  return {
    id: `e-${ts}`,
    provider: 'github',
    repo: 'acme/app',
    branch: 'main',
    status,
    startedAt: ts,
    finishedAt: ts + 60_000,
    duration: 60_000,
    tags: [],
  } as unknown as HistoryEntry;
}

describe('intensityChar', () => {
  it('returns blank space when max is 0', () => {
    expect(intensityChar(0, 0)).toBe(' ');
  });

  it('returns full block at maximum value', () => {
    expect(intensityChar(10, 10)).toBe('█');
  });

  it('returns first non-space char for low value', () => {
    const ch = intensityChar(1, 100);
    expect(ch).toBe('░');
  });

  it('clamps to last char when value exceeds max', () => {
    expect(intensityChar(200, 10)).toBe('█');
  });
});

describe('renderHeatmapPanel', () => {
  it('returns lines including hour header and 7 day rows', () => {
    const lines = renderHeatmapPanel([]);
    // header + 7 day rows + blank + peak label
    expect(lines.length).toBe(10);
  });

  it('includes day abbreviations', () => {
    const lines = renderHeatmapPanel([]);
    const dayLines = lines.slice(1, 8);
    const labels = dayLines.map((l) => l.slice(0, 3));
    expect(labels).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('shows "No data" peak label when no entries', () => {
    const lines = renderHeatmapPanel([]);
    expect(lines[lines.length - 1]).toBe('No data');
  });

  it('shows peak hour when entries exist', () => {
    // Wednesday 14:30 UTC
    const ts = new Date('2024-03-13T14:30:00Z').getTime();
    const entries = Array.from({ length: 5 }, () => makeEntry(ts));
    const lines = renderHeatmapPanel(entries);
    const peakLine = lines[lines.length - 1];
    expect(peakLine).toMatch(/Peak hour: 14:00/);
    expect(peakLine).toMatch(/5 deploys/);
  });

  it('renders non-blank cells for active hours', () => {
    const ts = new Date('2024-03-13T10:00:00Z').getTime();
    const entries = Array.from({ length: 10 }, () => makeEntry(ts));
    const lines = renderHeatmapPanel(entries);
    const hasActivity = lines.slice(1, 8).some((l) => l.includes('█'));
    expect(hasActivity).toBe(true);
  });
});
