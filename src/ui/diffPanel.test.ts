import { describe, it, expect, vi } from "vitest";
import { formatDiffRow } from "./diffPanel";
import { DeploymentDiff } from "../history/diff";
import { HistoryEntry } from "../history/history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "x1",
    provider: "github",
    repo: "acme/app",
    environment: "production",
    branch: "main",
    status: "success",
    startedAt: "2024-01-01T10:00:00Z",
    finishedAt: "2024-01-01T10:05:00Z",
    durationMs: 300_000,
    tags: [],
    ...overrides,
  };
}

function makeDiff(overrides: Partial<DeploymentDiff> = {}): DeploymentDiff {
  return {
    key: "github:acme/app:production",
    previous: makeEntry({ status: "failure" }),
    current: makeEntry(),
    durationDelta: 60_000,
    statusChanged: true,
    branchChanged: false,
    ...overrides,
  };
}

describe("formatDiffRow", () => {
  it("includes the key", () => {
    const row = formatDiffRow(makeDiff());
    expect(row).toContain("github:acme/app:production");
  });

  it("includes positive duration delta", () => {
    const row = formatDiffRow(makeDiff({ durationDelta: 30_000 }));
    expect(row).toContain("+30s");
  });

  it("includes negative duration delta", () => {
    const row = formatDiffRow(makeDiff({ durationDelta: -15_000 }));
    expect(row).toContain("-15s");
  });

  it("shows dash when delta is null", () => {
    const row = formatDiffRow(makeDiff({ durationDelta: null }));
    expect(row).toContain("-");
  });

  it("highlights branch when branchChanged is true", () => {
    const current = makeEntry({ branch: "feature/y" });
    const row = formatDiffRow(makeDiff({ branchChanged: true, current }));
    expect(row).toContain("{yellow-fg}");
    expect(row).toContain("feature/y");
  });

  it("does not highlight branch when unchanged", () => {
    const row = formatDiffRow(makeDiff({ branchChanged: false }));
    expect(row).not.toContain("{yellow-fg}");
  });
});
