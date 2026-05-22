import { renderSearchPanel } from "./searchPanel";
import { HistoryEntry } from "../history/history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "abc",
    provider: "github",
    repo: "org/repo",
    branch: "main",
    status: "success",
    timestamp: new Date("2024-03-01T10:00:00Z").toISOString(),
    durationMs: 30000,
    ...overrides,
  };
}

function makeBox() {
  let content = "";
  return {
    setContent: (c: string) => { content = c; },
    getContent: () => content,
    screen: { render: jest.fn() },
  } as any;
}

describe("renderSearchPanel", () => {
  it("renders header row", () => {
    const box = makeBox();
    renderSearchPanel(box, [makeEntry()], {});
    expect(box.getContent()).toContain("PROVIDER");
    expect(box.getContent()).toContain("REPO");
    expect(box.getContent()).toContain("STATUS");
  });

  it("renders matching entries", () => {
    const box = makeBox();
    const entries = [
      makeEntry({ id: "1", repo: "org/api", status: "success" }),
      makeEntry({ id: "2", repo: "org/web", status: "failure" }),
    ];
    renderSearchPanel(box, entries, { status: "failure" });
    const content = box.getContent();
    expect(content).toContain("org/web");
    expect(content).not.toContain("org/api");
  });

  it("shows result count summary", () => {
    const box = makeBox();
    renderSearchPanel(box, [makeEntry(), makeEntry()], {});
    expect(box.getContent()).toContain("2 results");
  });

  it("shows singular result label", () => {
    const box = makeBox();
    renderSearchPanel(box, [makeEntry()], {});
    expect(box.getContent()).toContain("1 result");
  });

  it("calls screen.render", () => {
    const box = makeBox();
    renderSearchPanel(box, [], {});
    expect(box.screen.render).toHaveBeenCalled();
  });

  it("renders branch column", () => {
    const box = makeBox();
    renderSearchPanel(box, [makeEntry({ branch: "feat/search" })], {});
    expect(box.getContent()).toContain("feat/search");
  });

  it("renders dash for missing branch", () => {
    const box = makeBox();
    renderSearchPanel(box, [makeEntry({ branch: undefined })], {});
    expect(box.getContent()).toContain("-");
  });
});
