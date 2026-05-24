import * as blessed from 'blessed';
import { detectFlapping, FlappingResult, FlappingOptions } from '../history/flapping';
import { HistoryEntry } from '../history/history';
import { colorizeStatus } from './layout';

const COL_KEY = 34;
const COL_TRANS = 8;
const COL_LAST = 22;

export function formatFlappingRow(r: FlappingResult): string {
  const key = r.key.length > COL_KEY ? r.key.slice(0, COL_KEY - 1) + '…' : r.key.padEnd(COL_KEY);
  const trans = String(r.transitions).padStart(COL_TRANS);
  const last = new Date(r.lastSeen).toISOString().slice(0, 19).replace('T', ' ');
  const flag = r.isFlapping ? colorizeStatus('failure', '⚡ FLAPPING') : '  stable  ';
  return `${key}${trans}   ${last}   ${flag}`;
}

export function renderFlappingPanel(
  box: blessed.Widgets.BoxElement,
  entries: HistoryEntry[],
  options?: FlappingOptions
): void {
  const results = detectFlapping(entries, options);
  const header =
    'deployment'.padEnd(COL_KEY) +
    'changes'.padStart(COL_TRANS) +
    '   last seen            status';
  const divider = '─'.repeat(80);
  const rows = results.length
    ? results.map(formatFlappingRow)
    : ['  No flapping deployments detected.'];
  box.setContent([header, divider, ...rows].join('\n'));
  box.screen.render();
}

export function createFlappingPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  entries: HistoryEntry[],
  options?: FlappingOptions
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' ⚡ Flapping Deployments ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    style: {
      border: { fg: 'yellow' },
      label: { fg: 'yellow', bold: true },
    },
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  renderFlappingPanel(box, entries, options);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  entries: HistoryEntry[],
  options?: FlappingOptions
): void {
  renderFlappingPanel(box, entries, options);
}
