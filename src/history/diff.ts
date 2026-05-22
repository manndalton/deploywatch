import { HistoryEntry } from "./history";

export interface DeploymentDiff {
  key: string;
  previous: HistoryEntry | null;
  current: HistoryEntry;
  durationDelta: number | null;
  statusChanged: boolean;
  branchChanged: boolean;
}

/**
 * Compare the current entry against the most recent previous entry for the same key.
 */
export function diffEntry(
  current: HistoryEntry,
  previous: HistoryEntry | null
): DeploymentDiff {
  const key = `${current.provider}:${current.repo}:${current.environment}`;

  const statusChanged = previous !== null && previous.status !== current.status;
  const branchChanged = previous !== null && previous.branch !== current.branch;

  let durationDelta: number | null = null;
  if (
    previous !== null &&
    typeof current.durationMs === "number" &&
    typeof previous.durationMs === "number"
  ) {
    durationDelta = current.durationMs - previous.durationMs;
  }

  return { key, previous, current, durationDelta, statusChanged, branchChanged };
}

/**
 * Given a list of entries (newest-first), produce diffs for each consecutive pair
 * sharing the same key.
 */
export function diffHistory(entries: HistoryEntry[]): DeploymentDiff[] {
  const seen = new Map<string, HistoryEntry>();
  const diffs: DeploymentDiff[] = [];

  // Iterate oldest-first so "seen" holds the previous entry when we process the next.
  const ordered = [...entries].reverse();

  for (const entry of ordered) {
    const key = `${entry.provider}:${entry.repo}:${entry.environment}`;
    const previous = seen.get(key) ?? null;
    diffs.unshift(diffEntry(entry, previous));
    seen.set(key, entry);
  }

  return diffs;
}
