import * as blessed from 'blessed';
import { RunbookEntry, RunbookStore, getRunbooks } from '../history/runbook';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_TITLE = 28;
const COL_URL = 48;

export function formatRunbookRow(entry: RunbookEntry): string {
  const title = pad(entry.title, COL_TITLE);
  const url = pad(entry.url, COL_URL);
  const updated = entry.updatedAt.slice(0, 10);
  return `${title} ${url} ${updated}`;
}

export function renderRunbooksPanel(
  box: blessed.Widgets.BoxElement,
  store: RunbookStore,
  entryKey: string
): void {
  const items = getRunbooks(store, entryKey);
  const header =
    '{bold}' +
    pad('Title', COL_TITLE) +
    ' ' +
    pad('URL', COL_URL) +
    ' Updated   {/bold}';
  const rows = items.map(e => formatRunbookRow(e));
  const content = [header, ...rows].join('\n');
  box.setContent(content);
  (box.screen as blessed.Widgets.Screen).render();
}

export function createRunbookPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  store: RunbookStore,
  entryKey: string
): {
  box: blessed.Widgets.BoxElement;
  refresh: (s: RunbookStore, key: string) => void;
} {
  const box = blessed.box({
    label: ' Runbooks ',
    top: 0,
    left: 0,
    width: totalWidth,
    height: 20,
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });

  (parent as blessed.Widgets.Screen).append(box);
  renderRunbooksPanel(box, store, entryKey);

  function refresh(s: RunbookStore, key: string): void {
    renderRunbooksPanel(box, s, key);
  }

  return { box, refresh };
}
