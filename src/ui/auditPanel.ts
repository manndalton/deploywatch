import * as blessed from 'blessed';
import { AuditEntry, AuditStore, getAuditLog } from '../history/audit';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_TIME = 22;
const COL_ACTION = 24;
const COL_TARGET = 20;
const COL_ACTOR = 14;

export function formatAuditRow(entry: AuditEntry): string {
  const time = pad(entry.timestamp.replace('T', ' ').replace(/\.\d+Z$/, ''), COL_TIME);
  const action = pad(entry.action, COL_ACTION);
  const target = pad(entry.targetId, COL_TARGET);
  const actor = pad(entry.actor, COL_ACTOR);
  const detail = entry.detail ?? '';
  return `${time}${action}${target}${actor}${detail}`;
}

export function renderAuditPanel(
  box: blessed.Widgets.BoxElement,
  store: AuditStore,
  targetId?: string
): void {
  const entries = getAuditLog(store, targetId);
  const header =
    pad('TIMESTAMP', COL_TIME) +
    pad('ACTION', COL_ACTION) +
    pad('TARGET', COL_TARGET) +
    pad('ACTOR', COL_ACTOR) +
    'DETAIL';
  const divider = '─'.repeat(totalWidth);
  const rows = entries.map(formatAuditRow);
  const content = [header, divider, ...rows].join('\n');
  box.setContent(content);
  box.screen.render();
}

export function createAuditPanel(
  screen: blessed.Widgets.Screen,
  store: AuditStore
): {
  box: blessed.Widgets.BoxElement;
  refresh: (s: AuditStore, targetId?: string) => void;
} {
  const box = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    label: ' Audit Log ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });

  screen.append(box);
  renderAuditPanel(box, store);

  function refresh(s: AuditStore, targetId?: string): void {
    renderAuditPanel(box, s, targetId);
  }

  return { box, refresh };
}
