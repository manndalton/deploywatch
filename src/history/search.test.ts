import { searchEntries, SearchOptions } from "./search";
import { HistoryEntry } from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "abc123",
    provider: "github",
    repo: "org/repo",
    branch: "main",
    status: "success",
    timestamp: new Date("2024-01-15T12:00:00Z").toISOString(),
    durationMs: 60000,
    ...overrides,
  };
}

describe("searchEntries", () => {
  const entries: HistoryEntry[] = [
    makeEntry({ id: "1", provider: "github", repo: "org/api", status: "success", branch: "main", timestamp: "2024-01-15T12:00:00Z" }),
    makeEntry({ id: "2", provider: "vercel", repo: "org/web", status: "failure", branch: "feat/x", timestamp: "2024-01-14T10:00:00Z" }),
    makeEntry({ id: "3", provider: "github", repo: "org/api", status: "failure", branch: "main", timestamp: "2024-01-13T08:00:00Z" }),
    makeEntry({ id: "4", provider: "vercel", repo: "org/web", status: "success", branch: "main", timestamp: "2024-01-12T06:00:00Z" }),
  ];

  it("returns all entries when no filters applied", () => {
    expect(searchEntries(entries, {})).toHaveLength(4);
  });

  it("filters by provider", () => {
    const result = searchEntries(entries, { provider: "github" });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.provider === "github")).toBe(true);
  });

  it("filters by repo substring", () => {
    const result = searchEntries(entries, { repo: "web" });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.repo.includes("web"))).toBe(true);
  });

  it("filters by status", () => {
    const result = searchEntries(entries, { status: "failure" });
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.status === "failure")).toBe(true);
  });

  it("filters by branch substring", () => {
    const result = searchEntries(entries, { branch: "feat" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by since date", () => {
    const result = searchEntries(entries, { since: new Date("2024-01-14T00:00:00Z") });
    expect(result).toHaveLength(2);
  });

  it("filters by until date", () => {
    const result = searchEntries(entries, { until: new Date("2024-01-13T23:59:59Z") });
    expect(result).toHaveLength(2);
  });

  it("applies limit", () => {
    const result = searchEntries(entries, { limit: 2 });
    expect(result).toHaveLength(2);
  });

  it("returns results sorted most recent first", () => {
    const result = searchEntries(entries, {});
    expect(result[0].id).toBe("1");
    expect(result[result.length - 1].id).toBe("4");
  });

  it("combines multiple filters", () => {
    const result = searchEntries(entries, { provider: "github", status: "success" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});
