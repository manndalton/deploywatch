import blessed from "blessed";
import { DeploymentMetrics } from "../history/metrics";
import { colorizeStatus } from "./layout";
import { pad } from "./formatRow";

const TREND_ICON: Record<string, string> = {
  improving: "↑",
  degrading: "↓",
  stable: "→",
};

const TREND_COLOR: Record<string, string> = {
  improving: "{green-fg}",
  degrading: "{red-fg}",
  stable: "{yellow-fg}",
};

export function formatMetricRow(label: string, value: string): string {
  return ` ${pad(label, 22)} ${value}`;
}

export function renderMetricsPanel(
  box: blessed.Widgets.BoxElement,
  metrics: DeploymentMetrics
): void {
  const trendIcon = TREND_ICON[metrics.trend] ?? "→";
  const trendColor = TREND_COLOR[metrics.trend] ?? "{white-fg}";
  const trendLine = `${trendColor}${trendIcon} ${metrics.trend}{/}`;

  const successColor =
    metrics.successRate >= 80
      ? "{green-fg}"
      : metrics.successRate >= 50
      ? "{yellow-fg}"
      : "{red-fg}";

  const avgDur =
    metrics.averageDuration > 0
      ? `${Math.floor(metrics.averageDuration / 60)}m ${metrics.averageDuration % 60}s`
      : "N/A";

  const lines = [
    formatMetricRow("Total Deployments", String(metrics.totalDeployments)),
    formatMetricRow(
      "Success Rate",
      `${successColor}${metrics.successRate}%{/}`
    ),
    formatMetricRow("Avg Duration", avgDur),
    formatMetricRow(
      "Failures",
      `{red-fg}${metrics.failureCount}{/}`
    ),
    formatMetricRow(
      "Rollbacks",
      `{magenta-fg}${metrics.rollbackCount}{/}`
    ),
    formatMetricRow("Trend", trendLine),
  ];

  box.setContent(lines.join("\n"));
  box.screen.render();
}

export function createMetricsPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: " Metrics ",
    border: { type: "line" },
    tags: true,
    scrollable: false,
    style: {
      border: { fg: "cyan" },
      label: { fg: "cyan", bold: true },
    },
    ...opts,
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  return box;
}
