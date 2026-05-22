import { describe, it, expect } from "vitest";
import { aggregateEntries, formatDuration } from "./aggregator";
import { DeploymentEntry } from "./history";

function makeEntry(
  overrides: Partial<DeploymentEntry> = {}
): DeploymentEntry {
  return {
    id: "abc123",
    provider: "github",
    project: "my-app",
    branch: "main",
    status: "success",
    timestamp: new Date().toISOString(),
    durationMs: 30_000,
    ...overrides,
  };
}

describe("aggregateEntries", () => {
  it("returns empty array for no entries", () => {
    expect(aggregateEntries([])).toEqual([]);
  });

  it("computes success rate correctly", () => {
    const entries = [
      makeEntry({ status: "success" }),
      makeEntry({ status: "success" }),
      makeEntry({ status: "failure" }),
      makeEntry({ status: "failure" }),
    ];
    const [stat] = aggregateEntries(entries);
    expect(stat.totalRuns).toBe(4);
    expect(stat.successCount).toBe(2);
    expect(stat.failureCount).toBe(2);
    expect(stat.successRate).toBe(50);
  });

  it("computes average duration", () => {
    const entries = [
      makeEntry({ durationMs: 10_000 }),
      makeEntry({ durationMs: 20_000 }),
      makeEntry({ durationMs: 30_000 }),
    ];
    const [stat] = aggregateEntries(entries);
    expect(stat.avgDurationMs).toBe(20_000);
  });

  it("returns null avgDurationMs when no durations available", () => {
    const entries = [makeEntry({ durationMs: undefined as unknown as number })];
    const [stat] = aggregateEntries(entries);
    expect(stat.avgDurationMs).toBeNull();
  });

  it("groups entries by provider and project separately", () => {
    const entries = [
      makeEntry({ provider: "github", project: "app-a" }),
      makeEntry({ provider: "vercel", project: "app-a" }),
      makeEntry({ provider: "github", project: "app-b" }),
    ];
    const stats = aggregateEntries(entries);
    expect(stats).toHaveLength(3);
  });

  it("picks the most recent entry as lastStatus", () => {
    const older = makeEntry({
      status: "failure",
      timestamp: new Date(Date.now() - 60_000).toISOString(),
    });
    const newer = makeEntry({
      status: "success",
      timestamp: new Date().toISOString(),
    });
    const [stat] = aggregateEntries([older, newer]);
    expect(stat.lastStatus).toBe("success");
  });
});

describe("formatDuration", () => {
  it("returns em dash for null", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("formats seconds", () => {
    expect(formatDuration(4500)).toBe("4.5s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90_000)).toBe("1m 30s");
  });
});
