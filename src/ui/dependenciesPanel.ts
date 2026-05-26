import type { Widgets } from 'blessed';
import {
  emptyDependencyStore,
  getDependencies,
  hasCycle,
} from '../history/dependencies';
import type { DependencyStore } from '../history/dependencies';
import type { HistoryEntry } from '../history/history';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_FROM = 28;
const COL_TO = 28;
const COL_CYCLE = 8;

export function formatDependencyRow(
  from: HistoryEntry,
  to: HistoryEntry,
  cyclic: boolean,
): string {
  const fromLabel = pad(from.repo, COL_FROM);
  const toLabel = pad(to.repo, COL_TO);
  const cycleFlag = cyclic ? '{red-fg}CYCLE{/red-fg}' : pad('', COL_CYCLE);
  return `${fromLabel} → ${toLabel} ${cycleFlag}`;
}

export function renderDependenciesPanel(
  store: DependencyStore,
  entries: HistoryEntry[],
): string {
  const byId = new Map<string, HistoryEntry>(entries.map((e) => [e.id, e]));
  const edges = getDependencies(store);

  if (edges.length === 0) {
    return '{center}No dependencies recorded{/center}';
  }

  const header =
    `{bold}${pad('From', COL_FROM)} → ${pad('To', COL_TO)} ${pad('Flag', COL_CYCLE)}{/bold}`;
  const divider = '─'.repeat(Math.min(totalWidth, COL_FROM + COL_TO + COL_CYCLE + 6));

  const rows = edges.map(({ fromId, toId }) => {
    const from = byId.get(fromId);
    const to = byId.get(toId);
    if (!from || !to) {
      return pad(`[missing: ${fromId} → ${toId}]`, totalWidth);
    }
    const cyclic = hasCycle(store, fromId, toId);
    return formatDependencyRow(from, to, cyclic);
  });

  return [header, divider, ...rows].join('\n');
}

export interface DependenciesPanel {
  refresh(store: DependencyStore, entries: HistoryEntry[]): void;
}

export function createDependenciesPanel(
  box: Widgets.BoxElement,
  initialStore: DependencyStore,
  initialEntries: HistoryEntry[],
): DependenciesPanel {
  function refresh(store: DependencyStore, entries: HistoryEntry[]): void {
    box.setContent(renderDependenciesPanel(store, entries));
    box.render();
  }

  refresh(initialStore, initialEntries);

  return { refresh };
}
