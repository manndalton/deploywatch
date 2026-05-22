import { formatBookmarkRow, renderBookmarksPanel } from "./bookmarksPanel";
import { addBookmark, BookmarkStore } from "../history/bookmarks";
import { HistoryEntry } from "../history/history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    provider: "github",
    repo: "org/repo",
    runId: "run-42",
    branch: "main",
    status: "success",
    startedAt: "2024-03-15T09:00:00Z",
    finishedAt: "2024-03-15T09:04:00Z",
    durationMs: 240000,
    ...overrides,
  };
}

function makeBox() {
  let content = "";
  return {
    setContent: (c: string) => {
      content = c;
    },
    getContent: () => content,
    screen: { render: jest.fn() },
  } as any;
}

describe("formatBookmarkRow", () => {
  it("formats a bookmark row with label, repo, date, and note", () => {
    const entry = makeEntry();
    let store: BookmarkStore = {};
    store = addBookmark(store, entry, "My Label", "deploy note");
    const bookmark = Object.values(store)[0];
    const row = formatBookmarkRow(bookmark);
    expect(row).toContain("My Label");
    expect(row).toContain("org/repo");
    expect(row).toContain("2024-");
    expect(row).toContain("deploy note");
  });

  it("handles missing note gracefully", () => {
    const entry = makeEntry();
    let store: BookmarkStore = {};
    store = addBookmark(store, entry, "No Note");
    const bookmark = Object.values(store)[0];
    const row = formatBookmarkRow(bookmark);
    expect(row).toContain("No Note");
    expect(row).not.toContain("undefined");
  });
});

describe("renderBookmarksPanel", () => {
  it("renders empty message when store is empty", () => {
    const box = makeBox();
    renderBookmarksPanel(box, {});
    expect(box.getContent()).toContain("No bookmarks");
  });

  it("renders header and rows when bookmarks exist", () => {
    const entry = makeEntry();
    let store: BookmarkStore = {};
    store = addBookmark(store, entry, "Release v2", "stable");
    const box = makeBox();
    renderBookmarksPanel(box, store);
    const content = box.getContent();
    expect(content).toContain("Label");
    expect(content).toContain("Release v2");
    expect(content).toContain("stable");
  });

  it("calls screen.render after updating content", () => {
    const box = makeBox();
    renderBookmarksPanel(box, {});
    expect(box.screen.render).toHaveBeenCalled();
  });
});
