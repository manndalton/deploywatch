import * as blessed from 'blessed';
import { EscalationStore, EscalationEvent, EscalationRule } from '../history/escalation';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

const LEVEL_COLORS: Record<string, string> = {
  warning: '{yellow-fg}',
  critical: '{red-fg}',
  page: '{magenta-fg}',
};

function colorLevel(level: string): string {
  const tag = LEVEL_COLORS[level] ?? '';
  const close = tag ? '{/}' : '';
  return `${tag}${level.toUpperCase()}${close}`;
}

export function formatEscalationRow(event: EscalationEvent, rules: EscalationRule[]): string {
  const rule = rules.find(r => r.id === event.ruleId);
  const name = rule ? rule.name : event.ruleId;
  const time = new Date(event.triggeredAt).toISOString().slice(11, 19);
  const key = event.entryKey.slice(0, 24);
  return [
    pad(time, 10),
    pad(colorLevel(event.level), 14),
    pad(key, 26),
    pad(name, 24),
    `x${event.failureCount}`,
  ].join(' ');
}

export function renderEscalationPanel(box: blessed.Widgets.BoxElement, store: EscalationStore): void {
  const header = `{bold}${pad('TIME', 10)} ${pad('LEVEL', 14)} ${pad('KEY', 26)} ${pad('RULE', 24)} COUNT{/bold}`;
  const rows = [...store.events]
    .sort((a, b) => b.triggeredAt - a.triggeredAt)
    .slice(0, 50)
    .map(ev => formatEscalationRow(ev, store.rules));

  box.setContent([header, ...rows].join('\n'));
  box.screen.render();
}

export function createEscalationPanel(
  screen: blessed.Widgets.Screen,
  options: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Escalations ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    style: { border: { fg: 'red' }, label: { fg: 'white', bold: true } },
    ...options,
  });
  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: EscalationStore
): void {
  renderEscalationPanel(box, store);
}
