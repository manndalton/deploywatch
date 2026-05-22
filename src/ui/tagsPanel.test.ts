import { collectTags, filterByTags, addTag } from "../history/tags";
import { HistoryEntry } from "../history/history";

// Unit tests for the tag utilities used by tagsPanel
// (blessed widgets require a TTY so we test the logic layer directly)

function makeEntry(
  id: string,
  tags?: string[]
): HistoryEntry {
  return {
    id,
    provider: "vercel",
    repo: "org/site",
    branch: "main",
    status: "success",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 500,
    tags,
  };
}

describe("tagsPanel tag interaction logic", () => {
  const entries = [
    makeEntry("a", ["prod", "api"]),
    makeEntry("b", ["staging", "api"]),
    makeEntry("c", ["prod"]),
  ];

  it("collectTags returns all unique tags sorted", () => {
    expect(collectTags(entries)).toEqual(["api", "prod", "staging"]);
  });

  it("selecting a tag narrows entries", () => {
    const active = ["prod"];
    const result = filterByTags(entries, active);
    expect(result.map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("selecting multiple tags narrows further", () => {
    const active = ["prod", "api"];
    const result = filterByTags(entries, active);
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });

  it("deselecting all tags shows all entries", () => {
    expect(filterByTags(entries, [])).toHaveLength(3);
  });

  it("addTag reflects in subsequent collectTags", () => {
    const updated = addTag(entries[2], "api");
    const all = [...entries.slice(0, 2), updated];
    expect(filterByTags(all, ["api"]).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("entries without tags property are treated as untagged", () => {
    const bare = makeEntry("z");
    expect(filterByTags([bare], ["prod"])).toHaveLength(0);
    expect(filterByTags([bare], [])).toHaveLength(1);
  });
});
