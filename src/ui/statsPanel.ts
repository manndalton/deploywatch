import { AggregatedStats, formatDuration } from "../history/aggregator";
import { colorizeStatus } from "./layout";
import { pad } from "./formatRow";

const COL_PROJECT = 20;
const COL_PROVIDER = 8;
const COL_RUNS = 6;
const COL_SUCCESS_RATE = 10;
const COL_AVG_DUR = 10;
const COL_LAST_STATUS = 12;

export function renderStatsHeader(): string {
  return [
    pad("PROJECT", COL_PROJECT),
    pad("PROVIDER", COL_PROVIDER),
    pad("RUNS", COL_RUNS),
    pad("SUCCESS%", COL_SUCCESS_RATE),
    pad("AVG DUR", COL_AVG_DUR),
    pad("LAST STATUS", COL_LAST_STATUS),
  ].join(" ");
}

export function renderStatsRow(stat: AggregatedStats): string {
  const successRateStr = `${stat.successRate.toFixed(1)}%`;
  const coloredStatus = colorizeStatus(stat.lastStatus);

  return [
    pad(stat.project, COL_PROJECT),
    pad(stat.provider, COL_PROVIDER),
    pad(String(stat.totalRuns), COL_RUNS),
    pad(successRateStr, COL_SUCCESS_RATE),
    pad(formatDuration(stat.avgDurationMs), COL_AVG_DUR),
    coloredStatus,
  ].join(" ");
}

export function renderStatsPanel(stats: AggregatedStats[]): string {
  if (stats.length === 0) {
    return "No history data available.";
  }

  const divider = "─".repeat(COL_PROJECT + COL_PROVIDER + COL_RUNS + COL_SUCCESS_RATE + COL_AVG_DUR + COL_LAST_STATUS + 5);

  const lines: string[] = [
    "\n📊 Deployment Statistics",
    divider,
    renderStatsHeader(),
    divider,
    ...stats.map(renderStatsRow),
    divider,
  ];

  return lines.join("\n");
}
