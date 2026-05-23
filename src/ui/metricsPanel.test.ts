import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatMetricRow, renderMetricsPanel, createMetricsPanel } from "./metricsPanel";
import { DeploymentMetrics } from "../history/metrics";

function makeMetrics(overrides: Partial<DeploymentMetrics> = {}): DeploymentMetrics {
  return {
    successRate: 80,
    averageDuration: 125,
    totalDeployments: 10,
    failureCount: 2,
    rollbackCount: 1,
    trend: "stable",
    points: [],
    ...overrides,
  };
}

function makeBox() {
  return {
    setContent: vi.fn(),
    append: vi.fn(),
    screen: { render: vi.fn() },
  } as any;
}

describe("formatMetricRow", () => {
  it("pads label and appends value", () => {
    const row = formatMetricRow("Success Rate", "80%");
    expect(row).toContain("Success Rate");
    expect(row).toContain("80%");
  });

  it("produces consistent width", () => {
    const r1 = formatMetricRow("Short", "val");
    const r2 = formatMetricRow("A Much Longer Label Here", "val");
    const idx1 = r1.indexOf("val");
    const idx2 = r2.indexOf("val");
    expect(idx1).toBe(idx2);
  });
});

describe("renderMetricsPanel", () => {
  it("calls setContent and render", () => {
    const box = makeBox();
    renderMetricsPanel(box, makeMetrics());
    expect(box.setContent).toHaveBeenCalledOnce();
    expect(box.screen.render).toHaveBeenCalledOnce();
  });

  it("includes success rate in content", () => {
    const box = makeBox();
    renderMetricsPanel(box, makeMetrics({ successRate: 95 }));
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain("95%");
  });

  it("shows N/A for zero average duration", () => {
    const box = makeBox();
    renderMetricsPanel(box, makeMetrics({ averageDuration: 0 }));
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain("N/A");
  });

  it("shows trend icon for degrading", () => {
    const box = makeBox();
    renderMetricsPanel(box, makeMetrics({ trend: "degrading" }));
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain("↓");
  });

  it("shows trend icon for improving", () => {
    const box = makeBox();
    renderMetricsPanel(box, makeMetrics({ trend: "improving" }));
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain("↑");
  });
});
