import * as blessed from 'blessed';
import { Alert, AlertStore, getUnacknowledged, AlertSeverity } from '../history/alerts';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: '{red-fg}',
  warning: '{yellow-fg}',
  info: '{cyan-fg}',
};

export function colorSeverity(severity: AlertSeverity, text: string): string {
  return `${SEVERITY_COLOR[severity]}${text}{/}`;
}

export function formatAlertRow(alert: Alert, width: number): string {
  const time = alert.createdAt.slice(11, 19);
  const sev = colorSeverity(alert.severity, pad(alert.severity.toUpperCase(), 8));
  const acked = alert.acknowledgedAt ? '{gray-fg}[ack]{/}' : '     ';
  const msg = alert.message.slice(0, width - 30);
  return `${pad(time, 10)} ${sev} ${acked} ${msg}`;
}

export function renderAlertsPanel(
  box: blessed.Widgets.BoxElement,
  store: AlertStore
): void {
  const unacked = getUnacknowledged(store);
  const all = store.alerts;
  const width = (box.width as number) - 4;

  const lines: string[] = [
    `{bold}Alerts{/} — {red-fg}${unacked.length} unacknowledged{/} / ${all.length} total`,
    '{gray-fg}' + '─'.repeat(width) + '{/}',
    ...all
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20)
      .map((a) => formatAlertRow(a, width)),
  ];

  box.setContent(lines.join('\n'));
  box.screen.render();
}

export function createAlertsPanel(
  parent: blessed.Widgets.Screen,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Alerts ',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    ...opts,
  });
  parent.append(box);
  return box;
}
