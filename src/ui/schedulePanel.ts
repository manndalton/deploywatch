import * as blessed from 'blessed';
import {
  ScheduleStore,
  ScheduledCheck,
  getSchedules,
  toggleSchedule,
  removeSchedule,
  getDueChecks,
} from '../history/schedule';
import { pad } from './formatRow';
import { colorizeStatus } from './layout';

export function formatScheduleRow(check: ScheduledCheck, width: number): string {
  const status = check.enabled ? 'active' : 'disabled';
  const colored = colorizeStatus(status);
  const due = new Date(check.nextRun).toISOString().slice(11, 19);
  const last = check.lastRun
    ? new Date(check.lastRun).toISOString().slice(11, 19)
    : '--:--:--';
  const tags = (check.tags ?? []).join(',') || '-';
  const label = pad(check.label, 20);
  return `${label} ${colored} ${pad(due, 10)} ${pad(last, 10)} ${pad(tags, width - 56)}`;
}

export function renderSchedulesPanel(store: ScheduleStore, box: blessed.Widgets.BoxElement): void {
  const checks = getSchedules(store);
  const width = (box.width as number) || 80;
  const header = `${pad('Label', 20)} ${pad('Status', 10)} ${pad('Next', 10)} ${pad('Last', 10)} Tags`;
  const separator = '-'.repeat(Math.min(width - 2, 70));
  const rows = checks.map((c) => formatScheduleRow(c, width));
  const due = getDueChecks(store);
  const footer = due.length > 0 ? `{yellow-fg}${due.length} check(s) due{/yellow-fg}` : '{green-fg}All up to date{/green-fg}';
  box.setContent([header, separator, ...rows, separator, footer].join('\n'));
  box.screen.render();
}

export function createSchedulesPanel(
  screen: blessed.Widgets.Screen,
  store: ScheduleStore,
  onToggle: (id: string) => void,
  onRemove: (id: string) => void
): { box: blessed.Widgets.BoxElement; refresh: (s: ScheduleStore) => void } {
  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '60%',
    border: { type: 'line' },
    label: ' Scheduled Checks ',
    tags: true,
    keys: true,
    mouse: true,
    scrollable: true,
    style: { border: { fg: 'cyan' } },
  });

  let current = store;

  box.key(['t'], () => {
    const checks = getSchedules(current);
    if (checks.length > 0) {
      current = toggleSchedule(current, checks[0].id);
      onToggle(checks[0].id);
      renderSchedulesPanel(current, box);
    }
  });

  box.key(['d'], () => {
    const checks = getSchedules(current);
    if (checks.length > 0) {
      const id = checks[0].id;
      current = removeSchedule(current, id);
      onRemove(id);
      renderSchedulesPanel(current, box);
    }
  });

  screen.append(box);
  renderSchedulesPanel(current, box);

  return {
    box,
    refresh(s: ScheduleStore) {
      current = s;
      renderSchedulesPanel(current, box);
    },
  };
}
