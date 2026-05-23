import * as blessed from 'blessed';
import { RollbackResult, RollbackStore, getRecentRollbacks } from '../history/rollback';
import { pad } from './formatRow';
import { totalWidth, colorizeStatus } from './layout';

const COL_WIDTHS = [24, 12, 20, 8, 26];

export function formatRollbackRow(result: RollbackResult): string {
  const status = result.success ? 'success' : 'failure';
  const project = pad(result.target.project, COL_WIDTHS[0]);
  const provider = pad(result.target.provider, COL_WIDTHS[1]);
  const reason = pad(result.target.reason ?? '—', COL_WIDTHS[2]);
  const statusCol = pad(colorizeStatus(status), COL_WIDTHS[3]);
  const time = pad(result.completedAt.toISOString().slice(0, 19).replace('T', ' '), COL_WIDTHS[4]);
  return `${project}${provider}${reason}${statusCol}${time}`;
}

export function renderRollbackPanel(store: RollbackStore, box: blessed.Widgets.BoxElement): void {
  const recent = getRecentRollbacks(store, 50);
  const header =
    pad('Project', COL_WIDTHS[0]) +
    pad('Provider', COL_WIDTHS[1]) +
    pad('Reason', COL_WIDTHS[2]) +
    pad('Result', COL_WIDTHS[3]) +
    pad('Completed At', COL_WIDTHS[4]);

  const separator = '─'.repeat(totalWidth);
  const rows = recent.map(formatRollbackRow);
  box.setContent([header, separator, ...rows].join('\n'));
  box.screen.render();
}

export function createRollbackPanel(
  screen: blessed.Widgets.Screen,
  store: RollbackStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Rollbacks ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
  });

  screen.append(box);
  renderRollbackPanel(store, box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: RollbackStore
): void {
  renderRollbackPanel(store, box);
}
