import * as blessed from 'blessed';
import { Snapshot, diffSnapshot } from '../history/snapshots';
import { HistoryEntry } from '../history/history';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

export function formatSnapshotRow(snap: Snapshot): string {
  const date = new Date(snap.createdAt).toLocaleString();
  const label = snap.label ?? '(unlabelled)';
  const count = String(snap.entries.length);
  return `${pad(snap.id, 14)} ${pad(label, 20)} ${pad(count, 6)} ${date}`;
}

export function renderSnapshotsPanel(
  box: blessed.Widgets.BoxElement,
  snapshots: Snapshot[],
  currentEntries: HistoryEntry[]
): void {
  const header = `{bold}${pad('ID', 14)} ${pad('Label', 20)} ${pad('Count', 6)} Created{/bold}`;
  const rows = snapshots.map((snap, idx) => {
    const diff = diffSnapshot(snap, currentEntries);
    const hasChanges = diff.added.length + diff.removed.length + diff.changed.length > 0;
    const changeMarker = hasChanges ? '{yellow-fg}*{/yellow-fg}' : ' ';
    return `${changeMarker} ${formatSnapshotRow(snap)}`;
  });

  box.setContent([header, ...rows].join('\n'));
  (box.screen as blessed.Widgets.Screen).render();
}

export function createSnapshotsPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  options: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Snapshots ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
    },
    ...options,
  });

  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);

  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  snapshots: Snapshot[],
  currentEntries: HistoryEntry[]
): void {
  renderSnapshotsPanel(box, snapshots, currentEntries);
}
