import { HistoryEntry } from './history';

export interface ReplayOptions {
  speedMultiplier?: number; // 1 = real time, 2 = 2x speed, 0 = instant
  from?: Date;
  to?: Date;
}

export interface ReplayFrame {
  entry: HistoryEntry;
  index: number;
  total: number;
  elapsed: number; // ms since replay started
}

export type ReplayCallback = (frame: ReplayFrame) => void | Promise<void>;

export function filterByTimeRange(
  entries: HistoryEntry[],
  from?: Date,
  to?: Date
): HistoryEntry[] {
  return entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    if (from && t < from.getTime()) return false;
    if (to && t > to.getTime()) return false;
    return true;
  });
}

export async function replayHistory(
  entries: HistoryEntry[],
  callback: ReplayCallback,
  options: ReplayOptions = {}
): Promise<void> {
  const { speedMultiplier = 1, from, to } = options;
  const filtered = filterByTimeRange(
    [...entries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    from,
    to
  );

  if (filtered.length === 0) return;

  const replayStart = Date.now();
  const firstTs = new Date(filtered[0].timestamp).getTime();

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const entryTs = new Date(entry.timestamp).getTime();
    const realDelay = entryTs - firstTs;

    if (speedMultiplier > 0) {
      const scaledDelay = realDelay / speedMultiplier;
      const elapsed = Date.now() - replayStart;
      const wait = scaledDelay - elapsed;
      if (wait > 0) await sleep(wait);
    }

    await callback({
      entry,
      index: i,
      total: filtered.length,
      elapsed: Date.now() - replayStart,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
