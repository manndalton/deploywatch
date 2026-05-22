import { HistoryEntry } from "./history";

export type ExportFormat = "json" | "csv";

export function exportEntries(
  entries: HistoryEntry[],
  format: ExportFormat
): string {
  if (format === "json") {
    return exportJson(entries);
  }
  return exportCsv(entries);
}

function exportJson(entries: HistoryEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

const CSV_HEADERS = ["id", "provider", "name", "status", "timestamp", "url"];

function exportCsv(entries: HistoryEntry[]): string {
  const rows = entries.map((e) => [
    csvEscape(e.id),
    csvEscape(e.provider),
    csvEscape(e.name),
    csvEscape(e.status),
    csvEscape(new Date(e.timestamp).toISOString()),
    csvEscape(e.url ?? ""),
  ]);

  const lines = [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))];
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}`;
  }
  return value;
}

export function exportFilename(format: ExportFormat): string {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `deploywatch-history-${ts}.${format}`;
}
