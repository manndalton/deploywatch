import * as blessed from 'blessed';
import {
  SilenceStore,
  SilenceRule,
  listSilenceRules,
  pruneExpired,
  isSilenced,
} from '../history/silencing';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_ID = 12;
const COL_PATTERN = 28;
const COL_REASON = 22;
const COL_EXPIRES = 26;

export function formatSilenceRow(rule: SilenceRule, now = new Date().toISOString()): string {
  const active = rule.expiresAt === null || rule.expiresAt > now;
  const status = active ? '{green-fg}ACTIVE{/green-fg}' : '{gray-fg}EXPIRED{/gray-fg}';
  const expires = rule.expiresAt ? rule.expiresAt.slice(0, 19).replace('T', ' ') : 'permanent';
  return (
    pad(rule.id.slice(0, COL_ID - 1), COL_ID) +
    pad(rule.pattern, COL_PATTERN) +
    pad(rule.reason, COL_REASON) +
    pad(expires, COL_EXPIRES) +
    status
  );
}

export function renderSilencingPanel(store: SilenceStore, box: blessed.Widgets.BoxElement): void {
  const now = new Date().toISOString();
  const rules = listSilenceRules(pruneExpired(store, now));
  const header =
    '{bold}' +
    pad('ID', COL_ID) +
    pad('PATTERN', COL_PATTERN) +
    pad('REASON', COL_REASON) +
    pad('EXPIRES', COL_EXPIRES) +
    'STATUS{/bold}';
  const separator = '─'.repeat(totalWidth);
  const rows = rules.map((r) => formatSilenceRow(r, now));
  const content =
    rows.length > 0
      ? [header, separator, ...rows].join('\n')
      : `${header}\n${separator}\n{gray-fg}No active silence rules.{/gray-fg}`;
  box.setContent(content);
  box.screen.render();
}

export function createSilencingPanel(
  screen: blessed.Widgets.Screen,
  store: SilenceStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Silencing Rules ',
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
    style: { border: { fg: 'yellow' }, label: { fg: 'yellow' } },
  });
  screen.append(box);
  renderSilencingPanel(store, box);
  return box;
}

export function refresh(store: SilenceStore, box: blessed.Widgets.BoxElement): void {
  renderSilencingPanel(store, box);
}
