import * as blessed from 'blessed';
import { Incident, IncidentStore, getOpenIncidents } from '../history/incidents';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

const SEVERITY_COLOR: Record<Incident['severity'], string> = {
  critical: '{red-fg}',
  high: '{yellow-fg}',
  medium: '{cyan-fg}',
  low: '{white-fg}',
};

export function formatIncidentRow(inc: Incident): string {
  const color = SEVERITY_COLOR[inc.severity];
  const sev = `${color}${pad(inc.severity, 8)}{/}`;
  const status = colorizeStatus(inc.status);
  const age = Math.round((Date.now() - inc.createdAt) / 60_000);
  const ageStr = age < 60 ? `${age}m` : `${Math.round(age / 60)}h`;
  return `${sev} ${status} ${pad(ageStr, 5)} ${inc.title.slice(0, 40)}`;
}

export function renderIncidentsPanel(
  box: blessed.Widgets.BoxElement,
  store: IncidentStore
): void {
  const open = getOpenIncidents(store);
  if (open.length === 0) {
    box.setContent('{green-fg}No open incidents{/}');
    return;
  }
  const header = `{bold}${pad('SEVERITY', 9)} ${pad('STATUS', 14)} ${pad('AGE', 5)} TITLE{/}`;
  const rows = open.map(formatIncidentRow);
  box.setContent([header, ...rows].join('\n'));
}

export function createIncidentsPanel(
  screen: blessed.Widgets.Screen,
  store: IncidentStore
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Incidents ',
    top: 0,
    left: 0,
    width: '50%',
    height: '30%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'red' } },
  });

  screen.append(box);
  renderIncidentsPanel(box, store);

  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: IncidentStore
): void {
  renderIncidentsPanel(box, store);
  box.screen.render();
}
