import * as blessed from 'blessed';
import { PinnedStore, getPins, PinnedEntry } from '../history/pinned';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_LABEL = 24;
const COL_KEY = 28;
const COL_NOTE = 24;

export function formatPinnedRow(entry: PinnedEntry): string {
  const ts = new Date(entry.pinnedAt).toISOString().slice(0, 16).replace('T', ' ');
  return (
    pad(entry.label, COL_LABEL) +
    pad(entry.entryKey, COL_KEY) +
    pad(entry.note ?? '', COL_NOTE) +
    ts
  );
}

export function renderPinnedPanel(
  box: blessed.Widgets.BoxElement,
  store: PinnedStore
): void {
  const pins = getPins(store);
  const header =
    '{bold}' +
    pad('Label', COL_LABEL) +
    pad('Entry Key', COL_KEY) +
    pad('Note', COL_NOTE) +
    'Pinned At' +
    '{/bold}';

  if (pins.length === 0) {
    box.setContent(header + '\n\n  No pinned entries.');
    return;
  }

  const rows = pins.map(formatPinnedRow).join('\n');
  box.setContent(header + '\n' + rows);
  box.screen.render();
}

export function createPinnedPanel(
  screen: blessed.Widgets.Screen,
  store: PinnedStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' 📌 Pinned Deployments ',
    top: 0,
    left: 0,
    width: totalWidth,
    height: '50%',
    border: { type: 'line' },
    style: { border: { fg: 'yellow' }, label: { fg: 'yellow' } },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
  });

  screen.append(box);
  renderPinnedPanel(box, store);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: PinnedStore
): void {
  renderPinnedPanel(box, store);
}
