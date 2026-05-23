import { HistoryEntry } from "./history";

export interface MetricPoint {
  timestamp: number;
  value: number;
  label: string;
}

export interface DeploymentMetrics {
  successRate: number;
  averageDuration: number;
  totalDeployments: number;
  failureCount: number;
  rollbackCount: number;
  trend: "improving" | "degrading" | "stable";
  points: MetricPoint[];
}

export function computeSuccessRate(entries: HistoryEntry[]): number {
  if (entries.length === 0) return 0;
  const successes = entries.filter(
    (e) => e.status === "success" || e.status === "ready"
  ).length;
  return Math.round((successes / entries.length) * 100);
}

export function computeAverageDuration(entries: HistoryEntry[]): number {
  const withDuration = entries.filter(
    (e) => typeof e.duration === "number" && e.duration > 0
  );
  if (withDuration.length === 0) return 0;
  const total = withDuration.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  return Math.round(total / withDuration.length);
}

export function buildMetricPoints(entries: HistoryEntry[]): MetricPoint[] {
  return entries.map((e) => ({
    timestamp: new Date(e.createdAt).getTime(),
    value: e.status === "success" || e.status === "ready" ? 1 : 0,
    label: e.name,
  }));
}

export function computeTrend(
  entries: HistoryEntry[]
): "improving" | "degrading" | "stable" {
  if (entries.length < 4) return "stable";
  const half = Math.floor(entries.length / 2);
  const older = entries.slice(0, half);
  const newer = entries.slice(half);
  const olderRate = computeSuccessRate(older);
  const newerRate = computeSuccessRate(newer);
  if (newerRate - olderRate >= 10) return "improving";
  if (olderRate - newerRate >= 10) return "degrading";
  return "stable";
}

export function aggregateMetrics(entries: HistoryEntry[]): DeploymentMetrics {
  const rollbackCount = entries.filter((e) =>
    (e.tags ?? []).includes("rollback")
  ).length;
  return {
    successRate: computeSuccessRate(entries),
    averageDuration: computeAverageDuration(entries),
    totalDeployments: entries.length,
    failureCount: entries.filter(
      (e) => e.status === "failure" || e.status === "error"
    ).length,
    rollbackCount,
    trend: computeTrend(entries),
    points: buildMetricPoints(entries),
  };
}
