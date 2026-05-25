import * as blessed from 'blessed';
import { ChangelogEntry, ChangelogStore, getChangelog } from '../history/changelog';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

const COL_TIME = 10;
const COL_PROVIDER = 8;
const COL_PROJECT = 20;
const COL_STATUS = 10;
const COL_AUTHOR = 12;

export function formatChangelogRow(entry: ChangelogEntry): string {
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const status = colorizeStatus(pad(entry.status, COL_STATUS));
  const provider = pad(entry.provider, COL_PROVIDER);
  const project = pad(entry.project, COL_PROJECT);
  const author = pad(entry.author ?? '—', COL_AUTHOR);
  const ref = entry.ref ? `{grey-fg}[${entry.ref}]{/}` : '';
  return `${pad(time, COL_TIME)} ${provider} ${project} ${status} ${author} ${entry.message} ${ref}`;
}

export function renderChangelogPanel(
  box: blessed.Widgets.BoxElement,
  store: ChangelogStore,
  limit = 50
): void {
  const entries = getChangelog(store, limit);
  if (entries.length === 0) {
    box.setContent('{grey-fg}No changelog entries yet.{/}');
    return;
  }
  const lines = entries.map(formatChangelogRow);
  box.setContent(lines.join('\n'));
}

export function createChangelogPanel(
  screen: blessed.Widgets.Screen,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Changelog ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
    ...opts,
  });
  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: ChangelogStore
): void {
  renderChangelogPanel(box, store);
  box.screen.render();
}
