import { exportEntries, exportFilename } from "./exporter";
import { HistoryEntry } from "./history";

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "run-123",
    provider: "github",
    name: "CI",
    status: "success",
    timestamp: 1700000000000,
    url: "https://github.com/org/repo/actions/runs/123",
    ...overrides,
  };
}

describe("exportEntries – json", () => {
  it("serialises entries as pretty-printed JSON", () => {
    const entries = [makeEntry(), makeEntry({ id: "run-456", status: "failure" })];
    const output = exportEntries(entries, "json");
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("run-123");
    expect(parsed[1].status).toBe("failure");
  });

  it("returns empty array JSON for no entries", () => {
    expect(exportEntries([], "json")).toBe("[]");
  });
});

describe("exportEntries – csv", () => {
  it("includes header row", () => {
    const csv = exportEntries([makeEntry()], "csv");
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toBe("id,provider,name,status,timestamp,url");
  });

  it("includes one data row per entry", () => {
    const csv = exportEntries([makeEntry(), makeEntry({ id: "run-999" })], "csv");
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data rows
  });

  it("escapes commas in values", () => {
    const entry = makeEntry({ name: "Build, Test" });
    const csv = exportEntries([entry], "csv");
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain('"Build, Test"');
  });

  it("uses empty string for missing url", () => {
    const entry = makeEntry({ url: undefined });
    const csv = exportEntries([entry], "csv");
    const dataLine = csv.split("\n")[1];
    expect(dataLine.endsWith(",")).toBe(true);
  });

  it("formats timestamp as ISO string", () => {
    const csv = exportEntries([makeEntry()], "csv");
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("2023-11-14");
  });
});

describe("exportFilename", () => {
  it("starts with deploywatch-history prefix", () => {
    expect(exportFilename("json")).toMatch(/^deploywatch-history-/);
  });

  it("ends with the correct extension", () => {
    expect(exportFilename("csv")).toMatch(/\.csv$/);
    expect(exportFilename("json")).toMatch(/\.json$/);
  });
});
