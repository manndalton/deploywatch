import { DeploymentEntry } from "./history";

export interface AggregatedStats {
  provider: string;
  project: string;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number | null;
  lastStatus: string;
  lastRunAt: string;
}

export function aggregateEntries(
  entries: DeploymentEntry[]
): AggregatedStats[] {
  const groups = new Map<string, DeploymentEntry[]>();

  for (const entry of entries) {
    const key = `${entry.provider}::${entry.project}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  }

  const stats: AggregatedStats[] = [];

  for (const [, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const totalRuns = sorted.length;
    const successCount = sorted.filter((e) => e.status === "success").length;
    const failureCount = sorted.filter(
      (e) => e.status === "failure" || e.status === "error"
    ).length;
    const successRate = totalRuns > 0 ? successCount / totalRuns : 0;

    const durations = sorted
      .map((e) => e.durationMs)
      .filter((d): d is number => typeof d === "number" && d > 0);
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

    const latest = sorted[0];

    stats.push({
      provider: latest.provider,
      project: latest.project,
      totalRuns,
      successCount,
      failureCount,
      successRate: Math.round(successRate * 1000) / 10,
      avgDurationMs,
      lastStatus: latest.status,
      lastRunAt: latest.timestamp,
    });
  }

  return stats.sort((a, b) => a.project.localeCompare(b.project));
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
