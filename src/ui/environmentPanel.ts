import * as blessed from 'blessed';
import {
  EnvironmentStore,
  EnvironmentRecord,
  summarizeEnvironments,
} from '../history/environment';
import { totalWidth } from './layout';

const ENV_COLORS: Record<string, string> = {
  production: '{red-fg}',
  preview: '{yellow-fg}',
  development: '{cyan-fg}',
};

function colorEnv(name: string): string {
  const color = ENV_COLORS[name] ?? '{white-fg}';
  return `${color}${name}{/}`;
}

export function formatEnvironmentRow(record: EnvironmentRecord): string {
  const env = colorEnv(record.name).padEnd(20);
  const provider = record.provider.padEnd(10);
  const branch = (record.branch ?? '—').padEnd(20);
  const url = record.url ?? '—';
  return `${env} ${provider} ${branch} ${url}`;
}

export function renderEnvironmentsPanel(
  box: blessed.Widgets.BoxElement,
  store: EnvironmentStore
): void {
  const summary = summarizeEnvironments(store);
  const summaryLine = Object.entries(summary)
    .map(([name, count]) => `${colorEnv(name)}: ${count}`)
    .join('  ');

  const header = `{bold}${'ENV'.padEnd(20)} ${'PROVIDER'.padEnd(10)} ${'BRANCH'.padEnd(20)} URL{/}`;
  const divider = '─'.repeat(totalWidth - 4);

  const rows = [...store.records]
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, 50)
    .map(formatEnvironmentRow);

  const lines = [summaryLine, divider, header, divider, ...rows];
  box.setContent(lines.join('\n'));
}

export function createEnvironmentPanel(
  screen: blessed.Widgets.Screen,
  store: EnvironmentStore
): { box: blessed.Widgets.BoxElement; refresh: (s: EnvironmentStore) => void } {
  const box = blessed.box({
    label: ' Environments ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'blue' } },
  });

  screen.append(box);
  renderEnvironmentsPanel(box, store);

  function refresh(updated: EnvironmentStore): void {
    renderEnvironmentsPanel(box, updated);
    screen.render();
  }

  return { box, refresh };
}
