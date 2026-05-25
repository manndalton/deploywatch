import { HistoryEntry } from './history';

export interface CoverageWindow {
  start: number;
  end: number;
  totalMs: number;
  coveredMs: number;
  gapMs: number;
  coveragePct: number;
}

export interface CoveragePoint {
  windowStart: number;
  coveragePct: number;
  deployCount: number;
}

/** Compute deployment coverage over a time window split into buckets. */
export function buildCoverage(
  entries: HistoryEntry[],
  windowMs: number,
  buckets: number,
  now: number = Date.now()
): CoveragePoint[] {
  const bucketSize = Math.floor(windowMs / buckets);
  const points: CoveragePoint[] = [];

  for (let i = 0; i < buckets; i++) {
    const start = now - windowMs + i * bucketSize;
    const end = start + bucketSize;

    const inBucket = entries.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= start && t < end;
    });

    // Merge overlapping deploy intervals within bucket
    const intervals = inBucket
      .map((e) => ({
        s: new Date(e.timestamp).getTime(),
        d: typeof e.duration === 'number' ? e.duration : 0,
      }))
      .map((e) => ({ s: Math.max(e.s, start), e: Math.min(e.s + e.d, end) }))
      .filter((iv) => iv.e > iv.s)
      .sort((a, b) => a.s - b.s);

    let covered = 0;
    let cursor = start;
    for (const iv of intervals) {
      if (iv.s > cursor) cursor = iv.s;
      if (iv.e > cursor) {
        covered += iv.e - cursor;
        cursor = iv.e;
      }
    }

    points.push({
      windowStart: start,
      coveragePct: bucketSize > 0 ? Math.min(100, (covered / bucketSize) * 100) : 0,
      deployCount: inBucket.length,
    });
  }

  return points;
}

export function summarizeCoverage(points: CoveragePoint[]): CoverageWindow {
  if (points.length === 0) {
    return { start: 0, end: 0, totalMs: 0, coveredMs: 0, gapMs: 0, coveragePct: 0 };
  }
  const avg = points.reduce((s, p) => s + p.coveragePct, 0) / points.length;
  const start = points[0].windowStart;
  const last = points[points.length - 1];
  const end = last.windowStart;
  const totalMs = end - start;
  const coveredMs = Math.round((avg / 100) * totalMs);
  return {
    start,
    end,
    totalMs,
    coveredMs,
    gapMs: totalMs - coveredMs,
    coveragePct: Math.round(avg * 10) / 10,
  };
}
