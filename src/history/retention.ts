import { HistoryEntry } from "./history";

export interface RetentionPolicy {
  maxAgeDays: number;
  maxEntries: number;
  keepFailures: boolean;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  maxAgeDays: 30,
  maxEntries: 500,
  keepFailures: true,
};

export function loadRetentionPolicy(
  overrides: Partial<RetentionPolicy> = {}
): RetentionPolicy {
  const maxAgeDays = Number(
    process.env.DEPLOYWATCH_RETENTION_DAYS ?? overrides.maxAgeDays ?? DEFAULT_RETENTION.maxAgeDays
  );
  const maxEntries = Number(
    process.env.DEPLOYWATCH_RETENTION_MAX ?? overrides.maxEntries ?? DEFAULT_RETENTION.maxEntries
  );
  const keepFailures =
    process.env.DEPLOYWATCH_RETENTION_KEEP_FAILURES !== undefined
      ? process.env.DEPLOYWATCH_RETENTION_KEEP_FAILURES !== "false"
      : (overrides.keepFailures ?? DEFAULT_RETENTION.keepFailures);

  return { maxAgeDays, maxEntries, keepFailures };
}

export function applyRetentionPolicy(
  entries: HistoryEntry[],
  policy: RetentionPolicy
): HistoryEntry[] {
  const cutoff = Date.now() - policy.maxAgeDays * 24 * 60 * 60 * 1000;

  let retained = entries.filter((e) => {
    const ts = new Date(e.timestamp).getTime();
    if (ts < cutoff) {
      // Always keep failures if policy demands it
      if (policy.keepFailures && (e.status === "failure" || e.status === "error")) {
        return true;
      }
      return false;
    }
    return true;
  });

  // Sort newest first, then cap by maxEntries
  retained.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (retained.length > policy.maxEntries) {
    // If keepFailures, ensure failures beyond the cap are not silently dropped
    if (policy.keepFailures) {
      const capped = retained.slice(0, policy.maxEntries);
      const failures = retained
        .slice(policy.maxEntries)
        .filter((e) => e.status === "failure" || e.status === "error");
      retained = [...capped, ...failures];
      retained.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else {
      retained = retained.slice(0, policy.maxEntries);
    }
  }

  return retained;
}
