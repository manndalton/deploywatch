import * as blessed from 'blessed';
import { CoveragePoint, summarizeCoverage } from '../history/coverage';

const BAR_CHARS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function coverageBar(pct: number, width = 10): string {
  const filled = Math.round((pct / 100) * width);
  const bar = '█'.repeat(filled).padEnd(width, '░');
  const color = pct >= 80 ? '{green-fg}' : pct >= 50 ? '{yellow-fg}' : '{red-fg}';
  return `${color}${bar}{/}`;
}

export function sparkline(points: CoveragePoint[], width = 20): string {
  const slice = points.slice(-width);
  return slice
    .map((p) => {
      const idx = Math.min(8, Math.round((p.coveragePct / 100) * 8));
      return BAR_CHARS[idx];
    })
    .join('')
    .padStart(width);
}

export function formatCoverageRow(point: CoveragePoint): string {
  const time = new Date(point.windowStart).toISOString().slice(11, 19);
  const bar = coverageBar(point.coveragePct, 20);
  const pct = `${point.coveragePct.toFixed(1).padStart(5)}%`;
  const cnt = `${point.deployCount} deploys`;
  return ` ${time}  ${bar}  ${pct}  ${cnt}`;
}

export function renderCoveragePanel(
  box: blessed.Widgets.BoxElement,
  points: CoveragePoint[]
): void {
  const summary = summarizeCoverage(points);
  const spark = sparkline(points, 30);
  const header = [
    ` Coverage: {bold}${summary.coveragePct}%{/bold}  Spark: ${spark}`,
    ` Covered: ${(summary.coveredMs / 1000).toFixed(0)}s  Gap: ${(summary.gapMs / 1000).toFixed(0)}s`,
    '',
    ` ${'TIME'.padEnd(10)}${'BAR'.padEnd(24)}${'PCT'.padStart(7)}  DEPLOYS`,
    ' ' + '─'.repeat(54),
  ];
  const rows = points.slice(-20).map(formatCoverageRow);
  box.setContent(header.concat(rows).join('\n'));
  box.screen.render();
}

export function createCoveragePanel(
  parent: blessed.Widgets.Screen,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Coverage ',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
    ...opts,
  });
  parent.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  points: CoveragePoint[]
): void {
  renderCoveragePanel(box, points);
}
