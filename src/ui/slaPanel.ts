import blessed from 'blessed';
import { evaluateSla, defaultPolicies, SlaSummary, SlaResult } from '../history/sla';
import { HistoryEntry } from '../history/history';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_PROJECT = 20;
const COL_PROVIDER = 10;
const COL_DURATION = 12;
const COL_POLICY = 12;
const COL_STATUS = 10;

export function formatSlaRow(result: SlaResult): string {
  const { entry, policy, durationMs, breached, overageMs } = result;
  const mins = (durationMs / 60000).toFixed(1);
  const status = breached
    ? `{red-fg}BREACH +${(overageMs / 60000).toFixed(1)}m{/}`
    : `{green-fg}OK{/}`;
  return [
    pad(entry.project, COL_PROJECT),
    pad(entry.provider, COL_PROVIDER),
    pad(`${mins}m`, COL_DURATION),
    pad(policy.name, COL_POLICY),
    status,
  ].join(' ');
}

export function renderSlaPanel(box: blessed.Widgets.BoxElement, entries: HistoryEntry[]): void {
  const policies = defaultPolicies();
  const summary = evaluateSla(entries, policies);
  const pct = (summary.compliance * 100).toFixed(1);
  const header =
    `{bold}SLA Compliance: ${pct}%  ` +
    `Breaches: ${summary.breached}/${summary.total}{/bold}\n` +
    `${pad('Project', COL_PROJECT)} ${pad('Provider', COL_PROVIDER)} ` +
    `${pad('Duration', COL_DURATION)} ${pad('Policy', COL_POLICY)} Status\n` +
    `${'─'.repeat(totalWidth - 2)}`;

  const rows = summary.results.map(formatSlaRow).join('\n');
  box.setContent(`${header}\n${rows || '(no data)'}`);
}

export function createSlaPanel(
  screen: blessed.Widgets.Screen,
  entries: HistoryEntry[]
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' SLA ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
  });

  screen.append(box);
  renderSlaPanel(box, entries);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  entries: HistoryEntry[]
): void {
  renderSlaPanel(box, entries);
  box.screen.render();
}
