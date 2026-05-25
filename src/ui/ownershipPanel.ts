import blessed from 'blessed';
import {
  OwnershipStore,
  Owner,
  getOwners,
  assignOwner,
  removeOwner,
} from '../history/ownership';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_KEY = 24;
const COL_NAME = 20;
const COL_TEAM = 16;
const COL_EMAIL = totalWidth - COL_KEY - COL_NAME - COL_TEAM - 4;

export function formatOwnerRow(entryKey: string, owner: Owner): string {
  return (
    pad(entryKey, COL_KEY) +
    ' ' +
    pad(owner.name, COL_NAME) +
    ' ' +
    pad(owner.team ?? '—', COL_TEAM) +
    ' ' +
    pad(owner.email ?? '—', COL_EMAIL)
  );
}

export function renderOwnershipPanel(
  store: OwnershipStore,
  filterKey?: string
): string[] {
  const header =
    '{bold}' +
    pad('Entry', COL_KEY) +
    ' ' +
    pad('Owner', COL_NAME) +
    ' ' +
    pad('Team', COL_TEAM) +
    ' ' +
    pad('Email', COL_EMAIL) +
    '{/bold}';

  const lines: string[] = [header];
  const records = Object.values(store.records).filter(
    (r) => !filterKey || r.entryKey === filterKey
  );

  if (records.length === 0) {
    lines.push('  {grey-fg}No ownership records.{/grey-fg}');
    return lines;
  }

  for (const record of records) {
    for (const owner of record.owners) {
      lines.push(formatOwnerRow(record.entryKey, owner));
    }
  }
  return lines;
}

export function createOwnershipPanel(
  screen: blessed.Widgets.Screen,
  store: { current: OwnershipStore }
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Ownership ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
  });

  function refresh() {
    const lines = renderOwnershipPanel(store.current);
    box.setContent(lines.join('\n'));
    screen.render();
  }

  refresh();
  return box;
}
