import {
  collectTags,
  filterByTags,
  addTag,
  removeTag,
  buildTagIndex,
} from "./tags";
import { HistoryEntry } from "./history";

function makeEntry(
  id: string,
  tags?: string[]
): HistoryEntry {
  return {
    id,
    provider: "github",
    repo: "org/repo",
    branch: "main",
    status: "success",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    tags,
  };
}

describe("collectTags", () => {
  it("returns sorted unique tags", () => {
    const entries = [
      makeEntry("1", ["prod", "backend"]),
      makeEntry("2", ["prod", "frontend"]),
      makeEntry("3", []),
    ];
    expect(collectTags(entries)).toEqual(["backend", "frontend", "prod"]);
  });

  it("returns empty array when no tags exist", () => {
    expect(collectTags([makeEntry("1")])).toEqual([]);
  });
});

describe("filterByTags", () => {
  const entries = [
    makeEntry("1", ["prod", "backend"]),
    makeEntry("2", ["prod", "frontend"]),
    makeEntry("3", ["staging"]),
  ];

  it("returns all entries when tags array is empty", () => {
    expect(filterByTags(entries, [])).toHaveLength(3);
  });

  it("filters by a single tag", () => {
    const result = filterByTags(entries, ["prod"]);
    expect(result.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("requires all tags to match", () => {
    const result = filterByTags(entries, ["prod", "backend"]);
    expect(result.map((e) => e.id)).toEqual(["1"]);
  });
});

describe("addTag / removeTag", () => {
  it("adds a tag without mutating", () => {
    const e = makeEntry("1", ["prod"]);
    const updated = addTag(e, "backend");
    expect(updated.tags).toContain("backend");
    expect(e.tags).not.toContain("backend");
  });

  it("does not duplicate existing tags", () => {
    const e = makeEntry("1", ["prod"]);
    expect(addTag(e, "prod").tags).toEqual(["prod"]);
  });

  it("removes a tag without mutating", () => {
    const e = makeEntry("1", ["prod", "backend"]);
    const updated = removeTag(e, "prod");
    expect(updated.tags).toEqual(["backend"]);
    expect(e.tags).toContain("prod");
  });
});

describe("buildTagIndex", () => {
  it("maps tags to entry ids", () => {
    const entries = [
      makeEntry("1", ["prod", "backend"]),
      makeEntry("2", ["prod"]),
    ];
    const index = buildTagIndex(entries);
    expect(index["prod"]).toEqual(["1", "2"]);
    expect(index["backend"]).toEqual(["1"]);
  });
});
