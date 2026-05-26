import * as blessed from 'blessed';
import { BudgetEvaluation } from '../history/budgets';
import { totalWidth, colorizeStatus } from './layout';
import { pad } from './formatRow';

const COL_NAME = 20;
const COL_PROVIDER = 10;
const COL_DURATION = 18;
const COL_FAILURE = 14;
const COL_STATUS = 10;

export function formatBudgetRow(ev: BudgetEvaluation): string {
  const name = pad(ev.budget.name, COL_NAME);
  const provider = pad(ev.budget.provider, COL_PROVIDER);
  const durActual = Math.round(ev.actualDurationMs / 1000);
  const durMax = Math.round(ev.budget.maxDurationMs / 1000);
  const duration = pad(`${durActual}s / ${durMax}s`, COL_DURATION);
  const frActual = (ev.actualFailureRate * 100).toFixed(1);
  const frMax = (ev.budget.maxFailureRate * 100).toFixed(1);
  const failureRate = pad(`${frActual}% / ${frMax}%`, COL_FAILURE);
  const statusStr = ev.breached ? 'BREACHED' : 'OK';
  const status = colorizeStatus(pad(statusStr, COL_STATUS), ev.breached ? 'failure' : 'success');
  return `${name} ${provider} ${duration} ${failureRate} ${status}`;
}

export function renderBudgetsPanel(
  box: blessed.Widgets.BoxElement,
  evaluations: BudgetEvaluation[]
): void {
  const header =
    pad('Budget', COL_NAME) +
    ' ' +
    pad('Provider', COL_PROVIDER) +
    ' ' +
    pad('Duration (act/max)', COL_DURATION) +
    ' ' +
    pad('FailRate (a/m)', COL_FAILURE) +
    ' ' +
    pad('Status', COL_STATUS);

  const divider = '─'.repeat(totalWidth);
  const rows = evaluations.map(formatBudgetRow);
  box.setContent([header, divider, ...rows].join('\n'));
  box.screen.render();
}

export function createBudgetsPanel(
  screen: blessed.Widgets.Screen
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Budgets ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });
  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  evaluations: BudgetEvaluation[]
): void {
  renderBudgetsPanel(box, evaluations);
}
