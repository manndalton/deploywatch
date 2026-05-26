import { HistoryEntry } from './history';

export interface TrendPoint {
  date: string; // ISO date string YYYY-MM-DD
  successRate: number;
  avgDuration: number;
  totalRuns: number;
}

export interface TrendSummary {
  points: TrendPoint[];
  overallDirection: 'improving' | 'degrading' | 'stable';
  peakSuccessDate: string | null;
  worstSuccessDate: string | null;
}

export function groupByDay(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const map = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const day = entry.startedAt.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }
  return map;
}

export function buildTrendPoints(entries: HistoryEntry[]): TrendPoint[] {
  const byDay = groupByDay(entries);
  const sortedDays = Array.from(byDay.keys()).sort();

  return sortedDays.map(date => {
    const dayEntries = byDay.get(date)!;
    const total = dayEntries.length;
    const successes = dayEntries.filter(e => e.status === 'success').length;
    const successRate = total > 0 ? successes / total : 0;
    const durations = dayEntries
      .filter(e => e.finishedAt != null)
      .map(e => new Date(e.finishedAt!).getTime() - new Date(e.startedAt).getTime());
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
    return { date, successRate, avgDuration, totalRuns: total };
  });
}

export function computeTrendDirection(
  points: TrendPoint[]
): 'improving' | 'degrading' | 'stable' {
  if (points.length < 2) return 'stable';
  const first = points.slice(0, Math.ceil(points.length / 2));
  const second = points.slice(Math.ceil(points.length / 2));
  const avg = (arr: TrendPoint[]) =>
    arr.reduce((s, p) => s + p.successRate, 0) / arr.length;
  const diff = avg(second) - avg(first);
  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'degrading';
  return 'stable';
}

export function buildTrendSummary(entries: HistoryEntry[]): TrendSummary {
  const points = buildTrendPoints(entries);
  const overallDirection = computeTrendDirection(points);
  const peakPoint = points.reduce<TrendPoint | null>(
    (best, p) => (best === null || p.successRate > best.successRate ? p : best),
    null
  );
  const worstPoint = points.reduce<TrendPoint | null>(
    (worst, p) => (worst === null || p.successRate < worst.successRate ? p : worst),
    null
  );
  return {
    points,
    overallDirection,
    peakSuccessDate: peakPoint?.date ?? null,
    worstSuccessDate: worstPoint?.date ?? null,
  };
}
