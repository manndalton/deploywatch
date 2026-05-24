import * as blessed from 'blessed';
import {
  OncallStore,
  OncallEntry,
  getCurrentOncall,
  getUpcomingOncall,
} from '../history/oncall';
import { totalWidth } from './layout';

const COL_NAME = 20;
const COL_EMAIL = 28;
const COL_START = 22;
const COL_TZ = 10;

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function formatTs(ts: number): string {
  return new Date(ts).toISOString().slice(0, 16).replace('T', ' ');
}

export function formatOncallRow(entry: OncallEntry, isCurrent: boolean): string {
  const marker = isCurrent ? '{green-fg}●{/green-fg} ' : '  ';
  return (
    marker +
    pad(entry.name, COL_NAME) +
    pad(entry.email, COL_EMAIL) +
    pad(formatTs(entry.startTs), COL_START) +
    pad(entry.timezone, COL_TZ)
  );
}

export function renderOncallPanel(store: OncallStore, box: blessed.Widgets.BoxElement): void {
  const now = Date.now();
  const current = getCurrentOncall(store, now);
  const upcoming = getUpcomingOncall(store, now, 6);

  const header =
    '  ' +
    pad('Name', COL_NAME) +
    pad('Email', COL_EMAIL) +
    pad('Shift Start', COL_START) +
    pad('TZ', COL_TZ);

  const lines: string[] = ['{bold}On-Call Schedule{/bold}', header, '{gray-fg}' + '─'.repeat(totalWidth - 4) + '{/gray-fg}'];

  if (current) {
    lines.push('{underline}Current:{/underline}');
    lines.push(formatOncallRow(current, true));
    lines.push('');
  } else {
    lines.push('{yellow-fg}No active on-call entry.{/yellow-fg}');
    lines.push('');
  }

  if (upcoming.length > 0) {
    lines.push('{underline}Upcoming:{/underline}');
    upcoming.forEach((e) => lines.push(formatOncallRow(e, false)));
  }

  box.setContent(lines.join('\n'));
}

export function createOncallPanel(
  screen: blessed.Widgets.Screen,
  store: OncallStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    label: ' On-Call ',
  });
  screen.append(box);
  renderOncallPanel(store, box);
  return box;
}

export function refresh(
  store: OncallStore,
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen
): void {
  renderOncallPanel(store, box);
  screen.render();
}
