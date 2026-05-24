import { HistoryEntry } from './history';

export interface HeatmapCell {
  hour: number;   // 0-23
  day: number;    // 0-6 (Sun-Sat)
  count: number;
  failures: number;
}

export interface HeatmapData {
  cells: HeatmapCell[][];
  maxCount: number;
}

export function buildHeatmap(entries: HistoryEntry[]): HeatmapData {
  // cells[day][hour]
  const cells: HeatmapCell[][] = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({ hour, day, count: 0, failures: 0 }))
  );

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const day = d.getDay();
    const hour = d.getHours();
    cells[day][hour].count += 1;
    if (entry.status === 'failure' || entry.status === 'error') {
      cells[day][hour].failures += 1;
    }
  }

  let maxCount = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (cell.count > maxCount) maxCount = cell.count;
    }
  }

  return { cells, maxCount };
}

export function heatIntensity(cell: HeatmapCell, maxCount: number): number {
  if (maxCount === 0) return 0;
  return Math.round((cell.count / maxCount) * 4);
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function peakHour(data: HeatmapData): { day: number; hour: number } | null {
  let best: HeatmapCell | null = null;
  for (const row of data.cells) {
    for (const cell of row) {
      if (!best || cell.count > best.count) best = cell;
    }
  }
  if (!best || best.count === 0) return null;
  return { day: best.day, hour: best.hour };
}
