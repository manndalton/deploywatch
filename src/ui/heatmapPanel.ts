import * as blessed from 'blessed';
import { buildHeatmap, heatIntensity, peakHour } from '../history/heatmap';
import { HistoryEntry } from '../history/history';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const INTENSITY_CHARS = [' ', '░', '▒', '▓', '█'];

export function intensityChar(value: number, max: number): string {
  if (max === 0) return INTENSITY_CHARS[0];
  const idx = Math.round((value / max) * (INTENSITY_CHARS.length - 1));
  return INTENSITY_CHARS[Math.min(idx, INTENSITY_CHARS.length - 1)];
}

export function renderHeatmapPanel(entries: HistoryEntry[]): string[] {
  const heatmap = buildHeatmap(entries);
  const peak = peakHour(heatmap);

  const maxVal = Math.max(
    ...DAYS.flatMap((_, d) => HOURS.map((h) => heatmap[d]?.[h] ?? 0))
  );

  const hourHeader =
    '     ' + HOURS.map((h) => (h % 3 === 0 ? String(h).padStart(2) : '  ')).join('');

  const rows: string[] = [hourHeader];

  for (let d = 0; d < 7; d++) {
    const label = DAYS[d].padEnd(4);
    const cells = HOURS.map((h) => {
      const val = heatmap[d]?.[h] ?? 0;
      const ch = intensityChar(val, maxVal);
      return ch + ch;
    }).join('');
    rows.push(label + ' ' + cells);
  }

  const peakLabel =
    peak !== undefined
      ? `Peak hour: ${peak}:00 (${heatIntensity(heatmap, peak)} deploys)`
      : 'No data';
  rows.push('');
  rows.push(peakLabel);

  return rows;
}

export function createHeatmapPanel(
  screen: blessed.Widgets.Screen,
  entries: HistoryEntry[]
): blessed.Widgets.BoxElement {
  const lines = renderHeatmapPanel(entries);

  const box = blessed.box({
    label: ' Deploy Heatmap ',
    top: 0,
    left: 0,
    width: '60%',
    height: lines.length + 4,
    border: { type: 'line' },
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
    content: lines.join('\n'),
    tags: false,
  });

  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  entries: HistoryEntry[]
): void {
  const lines = renderHeatmapPanel(entries);
  box.setContent(lines.join('\n'));
}
