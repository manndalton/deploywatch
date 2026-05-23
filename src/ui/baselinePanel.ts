import * as blessed from 'blessed';
import { BaselineStore, Baseline, compareToBaseline, findBaselineById } from '../history/baseline';
import { HistoryEntry } from '../history/history';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

export function formatBaselineRow(baseline: Baseline): string {
  const date = new Date(baseline.createdAt).toISOString().slice(0, 16).replace('T', ' ');
  const count = String(baseline.entries.length).padStart(4);
  return `${pad(baseline.id, 20)} ${pad(baseline.label, 18)} ${date}  entries:${count}`;
}

export function renderBaselinesPanel(store: BaselineStore, box: blessed.Widgets.BoxElement): void {
  if (store.baselines.length === 0) {
    box.setContent('{center}No baselines saved{/center}');
    box.screen.render();
    return;
  }
  const header = `${'ID'.padEnd(20)} ${'LABEL'.padEnd(18)} CREATED AT           ENTRIES`;
  const divider = '─'.repeat(70);
  const rows = store.baselines
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(formatBaselineRow);
  box.setContent([header, divider, ...rows].join('\n'));
  box.screen.render();
}

export function renderComparisonPanel(
  store: BaselineStore,
  baselineId: string,
  current: HistoryEntry[],
  box: blessed.Widgets.BoxElement
): void {
  const baseline = findBaselineById(store, baselineId);
  if (!baseline) {
    box.setContent(`{red-fg}Baseline ${baselineId} not found{/red-fg}`);
    box.screen.render();
    return;
  }
  const { added, removed, changed } = compareToBaseline(baseline, current);
  const lines: string[] = [
    `Comparing to baseline: {bold}${baseline.label}{/bold}`,
    '─'.repeat(60),
    `{green-fg}+ Added   (${added.length}){/green-fg}`,
    ...added.map(e => `  + ${e.id}  ${colorizeStatus(e.status)}`),
    `{red-fg}- Removed (${removed.length}){/red-fg}`,
    ...removed.map(e => `  - ${e.id}  ${colorizeStatus(e.status)}`),
    `{yellow-fg}~ Changed (${changed.length}){/yellow-fg}`,
    ...changed.map(e => {
      const base = baseline.entries.find(b => b.id === e.id);
      return `  ~ ${e.id}  ${colorizeStatus(base?.status ?? '')} → ${colorizeStatus(e.status)}`;
    }),
  ];
  box.setContent(lines.join('\n'));
  box.screen.render();
}

export function createBaselinePanel(parent: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  return blessed.box({
    parent,
    label: ' Baselines ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });
}
