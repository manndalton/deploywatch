import * as blessed from 'blessed';
import {
  RemediationStore,
  RemediationAction,
  getRemediationsForEntry,
} from '../history/remediation';

const STATUS_COLORS: Record<RemediationAction['status'], string> = {
  pending: '{yellow-fg}',
  in_progress: '{cyan-fg}',
  resolved: '{green-fg}',
  dismissed: '{gray-fg}',
};

export function colorStatus(status: RemediationAction['status']): string {
  const tag = STATUS_COLORS[status] ?? '';
  return `${tag}${status}{/}`;
}

export function formatRemediationRow(action: RemediationAction): string {
  const date = new Date(action.createdAt).toISOString().slice(0, 10);
  const assignee = action.assignee ?? '-';
  return ` ${colorStatus(action.status).padEnd(12)} ${date}  ${assignee.padEnd(12)} ${action.title}`;
}

export function renderRemediationPanel(
  box: blessed.Widgets.BoxElement,
  store: RemediationStore,
  entryKey?: string
): void {
  const actions = entryKey
    ? getRemediationsForEntry(store, entryKey)
    : store.actions;

  if (actions.length === 0) {
    box.setContent(' No remediation actions.');
    box.screen.render();
    return;
  }

  const header = ` {bold}Status       Date        Assignee     Title{/}`;
  const rows = actions.map(formatRemediationRow).join('\n');
  box.setContent(`${header}\n${rows}`);
  box.screen.render();
}

export function createRemediationPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Remediation ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'magenta' }, label: { fg: 'white' } },
    ...opts,
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: RemediationStore,
  entryKey?: string
): void {
  renderRemediationPanel(box, store, entryKey);
}
