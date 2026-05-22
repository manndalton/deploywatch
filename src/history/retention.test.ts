import { applyRetentionPolicy, loadRetentionPolicy, DEFAULT_RETENTION } from "./retention";
import { HistoryEntry } from "./history";

function makeEntry(
  id: string,
  status: string,
  daysAgo: number
): HistoryEntry {
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { id, provider: "github", name: "repo", status, timestamp: ts, duration: 60 };
}

describe("loadRetentionPolicy", () => {
  afterEach(() => {
    delete process.env.DEPLOYWATCH_RETENTION_DAYS;
    delete process.env.DEPLOYWATCH_RETENTION_MAX;
    delete process.env.DEPLOYWATCH_RETENTION_KEEP_FAILURES;
  });

  it("returns defaults when no env or overrides", () => {
    const policy = loadRetentionPolicy();
    expect(policy).toEqual(DEFAULT_RETENTION);
  });

  it("respects env variables", () => {
    process.env.DEPLOYWATCH_RETENTION_DAYS = "7";
    process.env.DEPLOYWATCH_RETENTION_MAX = "100";
    process.env.DEPLOYWATCH_RETENTION_KEEP_FAILURES = "false";
    const policy = loadRetentionPolicy();
    expect(policy.maxAgeDays).toBe(7);
    expect(policy.maxEntries).toBe(100);
    expect(policy.keepFailures).toBe(false);
  });

  it("overrides take lower precedence than env", () => {
    process.env.DEPLOYWATCH_RETENTION_DAYS = "14";
    const policy = loadRetentionPolicy({ maxAgeDays: 60 });
    expect(policy.maxAgeDays).toBe(14);
  });
});

describe("applyRetentionPolicy", () => {
  it("removes entries older than maxAgeDays", () => {
    const entries = [makeEntry("a", "success", 5), makeEntry("b", "success", 35)];
    const result = applyRetentionPolicy(entries, { ...DEFAULT_RETENTION, maxAgeDays: 30 });
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });

  it("keeps failures even when older than maxAgeDays", () => {
    const entries = [makeEntry("a", "success", 40), makeEntry("b", "failure", 40)];
    const result = applyRetentionPolicy(entries, { maxAgeDays: 30, maxEntries: 500, keepFailures: true });
    expect(result.map((e) => e.id)).toContain("b");
    expect(result.map((e) => e.id)).not.toContain("a");
  });

  it("caps entries at maxEntries", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(String(i), "success", i)
    );
    const result = applyRetentionPolicy(entries, { maxAgeDays: 90, maxEntries: 5, keepFailures: false });
    expect(result.length).toBe(5);
  });

  it("preserves failures beyond maxEntries when keepFailures is true", () => {
    const entries = [
      ...Array.from({ length: 5 }, (_, i) => makeEntry(`s${i}`, "success", i)),
      makeEntry("f1", "failure", 6),
    ];
    const result = applyRetentionPolicy(entries, { maxAgeDays: 90, maxEntries: 5, keepFailures: true });
    expect(result.some((e) => e.id === "f1")).toBe(true);
  });

  it("returns entries sorted newest first", () => {
    const entries = [makeEntry("old", "success", 3), makeEntry("new", "success", 1)];
    const result = applyRetentionPolicy(entries, DEFAULT_RETENTION);
    expect(result[0].id).toBe("new");
  });
});
