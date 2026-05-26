import * as blessed from 'blessed';
import { TrendSummary, TrendPoint } from '../history/trends';

const DIRECTION_ICON: Record<string, string> = {
  improving: '↑',
  degrading: '↓',
  stable: '→',
};

const DIRECTION_COLOR: Record<string, string> = {
  improving: '{green-fg}',
  degrading: '{red-fg}',
  stable: '{yellow-fg}',
};

export function sparkline(points: TrendPoint[], width = 20): string {
  const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const slice = points.slice(-width);
  return slice
    .map(p => bars[Math.min(7, Math.floor(p.successRate * 8))])
    .join('');
}

export function formatTrendRow(point: TrendPoint): string {
  const rate = (point.successRate * 100).toFixed(1).padStart(5);
  const dur = (point.avgDuration / 1000).toFixed(1).padStart(6);
  const runs = String(point.totalRuns).padStart(4);
  return `${point.date}  ${rate}%  ${dur}s  ${runs} runs`;
}

export function renderTrendsPanel(
  box: blessed.Widgets.BoxElement,
  summary: TrendSummary
): void {
  const dir = summary.overallDirection;
  const icon = DIRECTION_ICON[dir];
  const color = DIRECTION_COLOR[dir];
  const spark = sparkline(summary.points);

  const header =
    `${color}${icon} Trend: ${dir}{/}` +
    `  Peak: ${summary.peakSuccessDate ?? 'N/A'}` +
    `  Worst: ${summary.worstSuccessDate ?? 'N/A'}`;

  const rows = summary.points
    .slice(-20)
    .reverse()
    .map(formatTrendRow);

  const content = [
    header,
    `Sparkline: ${spark}`,
    '',
    'Date        Rate    Dur  Runs',
    '─'.repeat(36),
    ...rows,
  ].join('\n');

  box.setContent(content);
  box.screen.render();
}

export function createTrendsPanel(
  screen: blessed.Widgets.Screen,
  summary: TrendSummary
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Trends ',
    top: 0,
    left: 0,
    width: '60%',
    height: '50%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
  });

  screen.append(box);
  renderTrendsPanel(box, summary);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  summary: TrendSummary
): void {
  renderTrendsPanel(box, summary);
}
