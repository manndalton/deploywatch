/**
 * Flapping detection: identifies deployments that repeatedly toggle
 * between success and failure states within a time window.
 */

import { HistoryEntry } from './history';

export interface FlappingResult {
  key: string;
  transitions: number;
  firstSeen: number;
  lastSeen: number;
  isFlapping: boolean;
}

export interface FlappingOptions {
  windowMs?: number;   // default: 1 hour
  threshold?: number;  // min transitions to be considered flapping, default: 3
}

const DEFAULT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_THRESHOLD = 3;

function entryKey(e: HistoryEntry): string {
  return `${e.provider}:${e.repo}:${e.name}`;
}

function isTerminal(status: string): boolean {
  return ['success', 'failure', 'error', 'cancelled'].includes(status.toLowerCase());
}

export function detectFlapping(
  entries: HistoryEntry[],
  options: FlappingOptions = {}
): FlappingResult[] {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const now = Date.now();

  const grouped = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    if (!isTerminal(entry.status)) continue;
    if (now - entry.timestamp > windowMs) continue;
    const k = entryKey(entry);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(entry);
  }

  const results: FlappingResult[] = [];
  for (const [key, group] of grouped) {
    const sorted = [...group].sort((a, b) => a.timestamp - b.timestamp);
    let transitions = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].status.toLowerCase();
      const curr = sorted[i].status.toLowerCase();
      const prevOk = prev === 'success';
      const currOk = curr === 'success';
      if (prevOk !== currOk) transitions++;
    }
    results.push({
      key,
      transitions,
      firstSeen: sorted[0].timestamp,
      lastSeen: sorted[sorted.length - 1].timestamp,
      isFlapping: transitions >= threshold,
    });
  }

  return results.sort((a, b) => b.transitions - a.transitions);
}
