import {
  addBookmark,
  removeBookmark,
  listBookmarks,
  findBookmarkByEntry,
  updateBookmarkNote,
  BookmarkStore,
} from "./bookmarks";
import { HistoryEntry } from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    provider: "github",
    repo: "org/repo",
    runId: "run-1",
    branch: "main",
    status: "success",
    startedAt: "2024-01-01T10:00:00Z",
    finishedAt: "2024-01-01T10:05:00Z",
    durationMs: 300000,
    ...overrides,
  };
}

describe("bookmarks", () => {
  const emptyStore: BookmarkStore = {};

  it("adds a bookmark for an entry", () => {
    const entry = makeEntry();
    const store = addBookmark(emptyStore, entry, "Important deploy");
    const bookmarks = listBookmarks(store);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].label).toBe("Important deploy");
    expect(bookmarks[0].entryKey).toBe("github:org/repo:run-1");
  });

  it("adds a bookmark with an optional note", () => {
    const entry = makeEntry();
    const store = addBookmark(emptyStore, entry, "Hotfix", "Critical patch");
    const bookmarks = listBookmarks(store);
    expect(bookmarks[0].note).toBe("Critical patch");
  });

  it("removes a bookmark by id", () => {
    const entry = makeEntry();
    let store = addBookmark(emptyStore, entry, "To remove");
    const id = listBookmarks(store)[0].id;
    store = removeBookmark(store, id);
    expect(listBookmarks(store)).toHaveLength(0);
  });

  it("finds a bookmark by entry key", () => {
    const entry = makeEntry();
    const store = addBookmark(emptyStore, entry, "Found");
    const found = findBookmarkByEntry(store, "github:org/repo:run-1");
    expect(found).toBeDefined();
    expect(found?.label).toBe("Found");
  });

  it("returns undefined when entry key not found", () => {
    const result = findBookmarkByEntry(emptyStore, "github:org/repo:missing");
    expect(result).toBeUndefined();
  });

  it("updates the note on an existing bookmark", () => {
    const entry = makeEntry();
    let store = addBookmark(emptyStore, entry, "Label", "old note");
    const id = listBookmarks(store)[0].id;
    store = updateBookmarkNote(store, id, "new note");
    expect(store[id].note).toBe("new note");
  });

  it("returns store unchanged when updating a missing id", () => {
    const store = updateBookmarkNote(emptyStore, "nonexistent", "note");
    expect(store).toEqual(emptyStore);
  });

  it("lists bookmarks sorted newest first", () => {
    const e1 = makeEntry({ runId: "run-1" });
    const e2 = makeEntry({ runId: "run-2" });
    let store = addBookmark(emptyStore, e1, "First");
    store = addBookmark(store, e2, "Second");
    const list = listBookmarks(store);
    expect(list[0].label).toBe("Second");
    expect(list[1].label).toBe("First");
  });
});
