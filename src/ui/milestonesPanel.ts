import * as blessed from 'blessed';
import { MilestoneStore, Milestone, listMilestones } from '../history/milestones';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_LABEL = 22;
const COL_ENTRY = 30;
const COL_DATE = 22;

export function formatMilestoneRow(ms: Milestone): string {
  const date = ms.createdAt.slice(0, 16).replace('T', ' ');
  const note = ms.note ? ` (${ms.note})` : '';
  const label = pad(ms.label + note, COL_LABEL);
  const entry = pad(ms.entryKey, COL_ENTRY);
  const dateCol = pad(date, COL_DATE);
  return `${label} ${entry} ${dateCol}`;
}

export function renderMilestonesPanel(
  box: blessed.Widgets.BoxElement,
  store: MilestoneStore
): void {
  const milestones = listMilestones(store);
  if (milestones.length === 0) {
    box.setContent('{center}No milestones recorded.{/center}');
    return;
  }

  const header =
    '{bold}' +
    pad('Label', COL_LABEL) +
    ' ' +
    pad('Entry Key', COL_ENTRY) +
    ' ' +
    pad('Created At', COL_DATE) +
    '{/bold}';

  const divider = '-'.repeat(totalWidth);
  const rows = milestones.map(formatMilestoneRow);
  box.setContent([header, divider, ...rows].join('\n'));
}

export function createMilestonesPanel(
  screen: blessed.Widgets.Screen,
  store: MilestoneStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Milestones ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  renderMilestonesPanel(box, store);
  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: MilestoneStore
): void {
  renderMilestonesPanel(box, store);
  box.screen.render();
}
