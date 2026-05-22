import { HistoryEntry } from "./history";

export interface SearchOptions {
  provider?: string;
  repo?: string;
  status?: string;
  branch?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

export function searchEntries(
  entries: HistoryEntry[],
  opts: SearchOptions
): HistoryEntry[] {
  let results = entries.slice();

  if (opts.provider) {
    const p = opts.provider.toLowerCase();
    results = results.filter((e) => e.provider.toLowerCase() === p);
  }

  if (opts.repo) {
    const r = opts.repo.toLowerCase();
    results = results.filter((e) => e.repo.toLowerCase().includes(r));
  }

  if (opts.status) {
    const s = opts.status.toLowerCase();
    results = results.filter((e) => e.status.toLowerCase() === s);
  }

  if (opts.branch) {
    const b = opts.branch.toLowerCase();
    results = results.filter(
      (e) => e.branch != null && e.branch.toLowerCase().includes(b)
    );
  }

  if (opts.since) {
    const since = opts.since.getTime();
    results = results.filter((e) => new Date(e.timestamp).getTime() >= since);
  }

  if (opts.until) {
    const until = opts.until.getTime();
    results = results.filter((e) => new Date(e.timestamp).getTime() <= until);
  }

  // Most recent first
  results.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (opts.limit != null && opts.limit > 0) {
    results = results.slice(0, opts.limit);
  }

  return results;
}
