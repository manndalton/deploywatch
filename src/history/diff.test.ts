import { describe, it, expect } from "vitest";
import { diffEntry, diffHistory } from "./diff";
import { HistoryEntry } from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "abc123",
    provider: "github",
    repo: "acme/app",
    environment: "production",
    branch: "main",
    status: "success",
    startedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
    finishedAt: new Date("2024-01-01T10:05:00Z").toISOString(),
    durationMs: 300_000,
    tags: [],
    ...overrides,
  };
}

describe("diffEntry", () => {
  it("returns null previous when no prior entry", () => {
    const current = makeEntry();
    const diff = diffEntry(current, null);
    expect(diff.previous).toBeNull();
    expect(diff.statusChanged).toBe(false);
    expect(diff.branchChanged).toBe(false);
    expect(diff.durationDelta).toBeNull();
  });

  it("detects status change", () => {
    const previous = makeEntry({ status: "failure" });
    const current = makeEntry({ status: "success" });
    const diff = diffEntry(current, previous);
    expect(diff.statusChanged).toBe(true);
  });

  it("detects branch change", () => {
    const previous = makeEntry({ branch: "main" });
    const current = makeEntry({ branch: "feature/x" });
    const diff = diffEntry(current, previous);
    expect(diff.branchChanged).toBe(true);
  });

  it("computes duration delta", () => {
    const previous = makeEntry({ durationMs: 200_000 });
    const current = makeEntry({ durationMs: 300_000 });
    const diff = diffEntry(current, previous);
    expect(diff.durationDelta).toBe(100_000);
  });

  it("returns null delta when duration missing", () => {
    const previous = makeEntry({ durationMs: undefined });
    const current = makeEntry({ durationMs: 300_000 });
    const diff = diffEntry(current, previous);
    expect(diff.durationDelta).toBeNull();
  });
});

describe("diffHistory", () => {
  it("returns empty array for empty input", () => {
    expect(diffHistory([])).toEqual([]);
  });

  it("pairs consecutive entries for same key", () => {
    const e1 = makeEntry({ id: "1", status: "failure", startedAt: "2024-01-01T09:00:00Z" });
    const e2 = makeEntry({ id: "2", status: "success", startedAt: "2024-01-01T10:00:00Z" });
    // newest-first input
    const diffs = diffHistory([e2, e1]);
    const changed = diffs.find((d) => d.current.id === "2");
    expect(changed?.statusChanged).toBe(true);
    expect(changed?.previous?.id).toBe("1");
  });

  it("does not cross-contaminate different keys", () => {
    const a = makeEntry({ id: "a", repo: "acme/app", environment: "production" });
    const b = makeEntry({ id: "b", repo: "acme/app", environment: "staging" });
    const diffs = diffHistory([a, b]);
    diffs.forEach((d) => expect(d.previous).toBeNull());
  });
});
