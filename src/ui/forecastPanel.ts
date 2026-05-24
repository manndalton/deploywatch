import * as blessed from 'blessed';
import { Forecast, ForecastPoint } from '../history/forecast';
import { colorizeStatus } from './layout';

const PANEL_TITLE = ' Deployment Forecast ';

function confidenceBar(confidence: number, width = 10): string {
  const filled = Math.round(confidence * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

function formatForecastRow(point: ForecastPoint, index: number): string {
  const date = new Date(point.timestamp);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dur = (point.predictedDuration / 1000).toFixed(0).padStart(5) + 's';
  const rate = (point.predictedSuccessRate * 100).toFixed(1).padStart(5) + '%';
  const bar = confidenceBar(point.confidence);
  const confPct = (point.confidence * 100).toFixed(0).padStart(3) + '%';
  return `  T+${String(index + 1).padStart(1)}  ${time}  dur:${dur}  rate:${rate}  conf:${confPct} ${bar}`;
}

export function renderForecastPanel(box: blessed.Widgets.BoxElement, forecast: Forecast): void {
  if (forecast.points.length === 0) {
    box.setContent('  No forecast data available.');
    box.screen.render();
    return;
  }

  const header = `  Generated: ${new Date(forecast.generatedAt).toLocaleTimeString()}  Horizon: ${(forecast.horizon / 3_600_000).toFixed(1)}h\n`;
  const divider = '  ' + '─'.repeat(58) + '\n';
  const rows = forecast.points.map((p, i) => formatForecastRow(p, i)).join('\n');
  box.setContent(header + divider + rows);
  box.screen.render();
}

export function createForecastPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  options: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: PANEL_TITLE,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan', bold: true } },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...options,
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  forecast: Forecast
): void {
  renderForecastPanel(box, forecast);
}
