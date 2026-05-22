import * as fs from "fs";
import * as path from "path";
import type { DeploymentStatus } from "../providers/types";

export interface HistoryEntry {
  timestamp: number;
  provider: string;
  id: string;
  name: string;
  status: DeploymentStatus;
  url?: string;
}

export interface HistoryStore {
  entries: HistoryEntry[];
}

const MAX_ENTRIES = 500;

export function loadHistory(filePath: string): HistoryStore {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as HistoryStore;
  } catch {
    return { entries: [] };
  }
}

export function saveHistory(filePath: string, store: HistoryStore): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const trimmed: HistoryStore = {
    entries: store.entries.slice(-MAX_ENTRIES),
  };
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2), "utf-8");
}

export function appendEntry(
  store: HistoryStore,
  entry: HistoryEntry
): HistoryStore {
  const existing = store.entries.findIndex(
    (e) => e.provider === entry.provider && e.id === entry.id
  );
  const entries = [...store.entries];
  if (existing !== -1) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }
  return { entries };
}

export function getRecentEntries(
  store: HistoryStore,
  limit: number
): HistoryEntry[] {
  return store.entries
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}
