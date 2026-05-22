import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadHistory,
  saveHistory,
  appendEntry,
  getRecentEntries,
  type HistoryEntry,
  type HistoryStore,
} from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    timestamp: Date.now(),
    provider: "github",
    id: "run-1",
    name: "CI",
    status: "success",
    ...overrides,
  };
}

describe("loadHistory", () => {
  it("returns empty store when file does not exist", () => {
    const store = loadHistory("/tmp/nonexistent-deploywatch-history.json");
    expect(store).toEqual({ entries: [] });
  });

  it("parses existing file correctly", () => {
    const tmp = path.join(os.tmpdir(), `dw-test-${Date.now()}.json`);
    const data: HistoryStore = { entries: [makeEntry()] };
    fs.writeFileSync(tmp, JSON.stringify(data));
    const store = loadHistory(tmp);
    expect(store.entries).toHaveLength(1);
    fs.unlinkSync(tmp);
  });
});

describe("saveHistory", () => {
  it("writes store to disk and creates directories", () => {
    const tmp = path.join(os.tmpdir(), `dw-dir-${Date.now()}`, "history.json");
    const store: HistoryStore = { entries: [makeEntry()] };
    saveHistory(tmp, store);
    const loaded = loadHistory(tmp);
    expect(loaded.entries).toHaveLength(1);
    fs.unlinkSync(tmp);
  });
});

describe("appendEntry", () => {
  it("adds a new entry when id is unseen", () => {
    const store: HistoryStore = { entries: [] };
    const result = appendEntry(store, makeEntry({ id: "run-2" }));
    expect(result.entries).toHaveLength(1);
  });

  it("updates existing entry with same provider+id", () => {
    const initial = makeEntry({ id: "run-1", status: "running" });
    const store: HistoryStore = { entries: [initial] };
    const updated = makeEntry({ id: "run-1", status: "success" });
    const result = appendEntry(store, updated);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].status).toBe("success");
  });
});

describe("getRecentEntries", () => {
  it("returns entries sorted by timestamp descending", () => {
    const e1 = makeEntry({ id: "a", timestamp: 1000 });
    const e2 = makeEntry({ id: "b", timestamp: 3000 });
    const e3 = makeEntry({ id: "c", timestamp: 2000 });
    const store: HistoryStore = { entries: [e1, e2, e3] };
    const recent = getRecentEntries(store, 2);
    expect(recent[0].id).toBe("b");
    expect(recent[1].id).toBe("c");
  });
});
