import blessed from 'blessed';
import { DeploymentStatus } from '../providers/types';
import { formatRow } from './formatRow';
import { COLUMN_WIDTHS } from './layout';

export interface DashboardWidgets {
  screen: blessed.Widgets.Screen;
  table: blessed.Widgets.ListElement;
  statusBar: blessed.Widgets.TextElement;
}

export function createDashboard(): DashboardWidgets {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'deploywatch',
  });

  const table = blessed.list({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-3',
    border: { type: 'line' },
    label: ' Deployments ',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      selected: { bg: 'blue', fg: 'white' },
      border: { fg: 'cyan' },
    },
  });

  const statusBar = blessed.text({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: { type: 'line' },
    tags: true,
    style: { border: { fg: 'grey' } },
  });

  screen.append(table);
  screen.append(statusBar);

  screen.key(['q', 'C-c'], () => process.exit(0));

  return { screen, table, statusBar };
}

export function renderDeployments(
  widgets: DashboardWidgets,
  deployments: DeploymentStatus[],
  lastUpdated: Date
): void {
  const { screen, table, statusBar } = widgets;

  const header = formatRow(
    ['Provider', 'Repo / Project', 'Branch', 'Status', 'Updated'],
    COLUMN_WIDTHS,
    true
  );

  const rows = deployments.map((d) =>
    formatRow(
      [d.provider, d.name, d.branch ?? '-', d.status, d.updatedAt],
      COLUMN_WIDTHS,
      false
    )
  );

  table.setItems([header, ...rows] as any);

  statusBar.setContent(
    ` {grey-fg}Last updated:{/grey-fg} ${lastUpdated.toLocaleTimeString()}   {grey-fg}[q]{/grey-fg} quit   {grey-fg}[↑↓]{/grey-fg} scroll`
  );

  screen.render();
}
