import blessed from 'blessed';
import { HealthScore, computeAllHealthScores } from '../history/healthscore';
import { HistoryEntry } from '../history/history';
import { totalWidth } from './layout';

const COL_KEY = 30;
const COL_GRADE = 6;
const COL_SCORE = 7;
const COL_SUCCESS = 10;
const COL_ANOMALY = 9;

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function gradeColor(grade: HealthScore['grade']): string {
  switch (grade) {
    case 'A': return '{green-fg}';
    case 'B': return '{cyan-fg}';
    case 'C': return '{yellow-fg}';
    case 'D': return '{magenta-fg}';
    case 'F': return '{red-fg}';
  }
}

export function formatHealthScoreRow(hs: HealthScore): string {
  const gc = gradeColor(hs.grade);
  const key = pad(hs.key, COL_KEY);
  const grade = `${gc}${pad(hs.grade, COL_GRADE)}{/}`;
  const score = pad(`${hs.score}`, COL_SCORE);
  const success = pad(`${(hs.successRate * 100).toFixed(1)}%`, COL_SUCCESS);
  const anomaly = pad(`${hs.anomalyCount}`, COL_ANOMALY);
  return `${key}${grade}${score}${success}${anomaly}`;
}

export function renderHealthScorePanel(box: blessed.Widgets.BoxElement, entries: HistoryEntry[]): void {
  const scores = computeAllHealthScores(entries);
  const header = `{bold}${pad('Deployment', COL_KEY)}${pad('Grade', COL_GRADE)}${pad('Score', COL_SCORE)}${pad('Success%', COL_SUCCESS)}${pad('Anomalies', COL_ANOMALY)}{/bold}`;
  const rows = scores.map(formatHealthScoreRow);
  box.setContent([header, ...rows].join('\n'));
  box.screen.render();
}

export function createHealthScorePanel(
  screen: blessed.Widgets.Screen,
  entries: HistoryEntry[]
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Health Scores ',
    top: 0,
    left: 0,
    width: totalWidth,
    height: '50%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });
  screen.append(box);
  renderHealthScorePanel(box, entries);
  return box;
}

export function refresh(box: blessed.Widgets.BoxElement, entries: HistoryEntry[]): void {
  renderHealthScorePanel(box, entries);
}
