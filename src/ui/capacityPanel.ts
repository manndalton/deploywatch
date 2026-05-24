import * as blessed from 'blessed';
import type { CapacityForecast, CapacityPoint } from '../history/capacity';

const BAR_WIDTH = 20;

function usageBar(rate: number): string {
  const filled = Math.round(rate * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  if (rate >= 0.9) return `{red-fg}${bar}{/red-fg}`;
  if (rate >= 0.7) return `{yellow-fg}${bar}{/yellow-fg}`;
  return `{green-fg}${bar}{/green-fg}`;
}

function trendIcon(trend: CapacityForecast['trend']): string {
  if (trend === 'growing') return '{red-fg}↑{/red-fg}';
  if (trend === 'shrinking') return '{green-fg}↓{/green-fg}';
  return '{cyan-fg}→{/cyan-fg}';
}

export function formatCapacityRow(point: CapacityPoint): string {
  const rate = point.used / point.limit;
  const pct = (rate * 100).toFixed(1).padStart(5);
  const time = point.timestamp.toISOString().slice(11, 19);
  return `  ${time}  ${usageBar(rate)}  ${pct}%  (${point.used}/${point.limit})`;
}

export function renderCapacityPanel(
  box: blessed.Widgets.BoxElement,
  forecast: CapacityForecast
): void {
  const lines: string[] = [];
  const pct = (forecast.currentUsageRate * 100).toFixed(1);
  lines.push(
    ` Usage: ${usageBar(forecast.currentUsageRate)}  ${pct}%  Trend: ${trendIcon(forecast.trend)}`
  );

  if (forecast.projectedExhaustionDate) {
    const d = forecast.projectedExhaustionDate.toLocaleString();
    lines.push(` {red-fg}Projected exhaustion: ${d}{/red-fg}`);
  } else {
    lines.push(' {green-fg}No exhaustion projected{/green-fg}');
  }

  lines.push('');
  const recent = forecast.points.slice(-8);
  for (const p of recent) {
    lines.push(formatCapacityRow(p));
  }

  box.setContent(lines.join('\n'));
  box.screen.render();
}

export function createCapacityPanel(
  parent: blessed.Widgets.Screen,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Capacity ',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    ...opts,
  });
  parent.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  forecast: CapacityForecast
): void {
  renderCapacityPanel(box, forecast);
}
