import { colorizeStatus } from './layout';

const STATUS_KEYWORDS = new Set([
  'success', 'completed', 'failure', 'failed', 'error',
  'in_progress', 'building', 'queued', 'pending',
  'cancelled', 'canceled', 'skipped', 'ready',
]);

function pad(value: string, width: number): string {
  if (value.length >= width) return value.slice(0, width - 1) + '…';
  return value.padEnd(width);
}

export function formatRow(
  cells: readonly string[],
  widths: readonly number[],
  isHeader: boolean
): string {
  return cells
    .map((cell, i) => {
      const w = widths[i] ?? 12;
      if (!isHeader && i === 3 && STATUS_KEYWORDS.has(cell.toLowerCase())) {
        const colored = colorizeStatus(cell);
        // pad the raw text, then wrap in color tags
        const padded = pad(cell, w);
        return colored.replace(cell, padded);
      }
      const display = isHeader ? `{bold}${pad(cell, w)}{/bold}` : pad(cell, w);
      return display;
    })
    .join(' ');
}
