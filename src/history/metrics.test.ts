import { describe, it, expect } from "vitest";
import {
  computeSuccessRate,
  computeAverageDuration,
  computeTrend,
  aggregateMetrics,
  buildMetricPoints,
} from "./metrics";
import { HistoryEntry } from "./history";

function makeEntry(
  status: string,
  duration = 120,
  tags: string[] = []
): HistoryEntry {
  return {
    id: Math.random().toString(36).slice(2),
    name: "my-app",
    provider: "github",
    status,
    duration,
    tags,
    createdAt: new Date().toISOString(),
    branch: "main",
    commit: "abc1234",
  } as HistoryEntry;
}

describe("computeSuccessRate", () => {
  it("returns 0 for empty entries", () => {
    expect(computeSuccessRate([])).toBe(0);
  });

  it("calculates correct success rate", () => {
    const entries = [
      makeEntry("success"),
      makeEntry("success"),
      makeEntry("failure"),
      makeEntry("ready"),
    ];
    expect(computeSuccessRate(entries)).toBe(75);
  });
});

describe("computeAverageDuration", () => {
  it("returns 0 when no entries have duration", () => {
    expect(computeAverageDuration([])).toBe(0);
  });

  it("averages durations correctly", () => {
    const entries = [makeEntry("success", 100), makeEntry("failure", 200)];
    expect(computeAverageDuration(entries)).toBe(150);
  });
});

describe("computeTrend", () => {
  it("returns stable for fewer than 4 entries", () => {
    expect(computeTrend([makeEntry("success")])).toBe("stable");
  });

  it("detects improving trend", () => {
    const entries = [
      makeEntry("failure"),
      makeEntry("failure"),
      makeEntry("success"),
      makeEntry("success"),
      makeEntry("success"),
      makeEntry("success"),
    ];
    expect(computeTrend(entries)).toBe("improving");
  });

  it("detects degrading trend", () => {
    const entries = [
      makeEntry("success"),
      makeEntry("success"),
      makeEntry("success"),
      makeEntry("failure"),
      makeEntry("failure"),
      makeEntry("failure"),
    ];
    expect(computeTrend(entries)).toBe("degrading");
  });
});

describe("aggregateMetrics", () => {
  it("produces correct aggregate", () => {
    const entries = [
      makeEntry("success", 60),
      makeEntry("failure", 30),
      makeEntry("success", 90, ["rollback"]),
    ];
    const m = aggregateMetrics(entries);
    expect(m.totalDeployments).toBe(3);
    expect(m.failureCount).toBe(1);
    expect(m.rollbackCount).toBe(1);
    expect(m.successRate).toBe(67);
    expect(m.averageDuration).toBe(60);
    expect(m.points).toHaveLength(3);
  });
});

describe("buildMetricPoints", () => {
  it("maps entries to points", () => {
    const entries = [makeEntry("success"), makeEntry("failure")];
    const points = buildMetricPoints(entries);
    expect(points[0].value).toBe(1);
    expect(points[1].value).toBe(0);
  });
});
