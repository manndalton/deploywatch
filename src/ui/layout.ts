export const COLUMN_WIDTHS = [10, 28, 18, 14, 12] as const;

export type ColumnWidths = typeof COLUMN_WIDTHS;

/** Total characters consumed by columns + separators */
export function totalWidth(widths: readonly number[]): number {
  return widths.reduce((sum, w) => sum + w, 0) + widths.length - 1;
}

/** Status to blessed color tag mapping */
export const STATUS_COLORS: Record<string, string> = {
  success: '{green-fg}',
  completed: '{green-fg}',
  failure: '{red-fg}',
  failed: '{red-fg}',
  error: '{red-fg}',
  in_progress: '{yellow-fg}',
  building: '{yellow-fg}',
  queued: '{cyan-fg}',
  pending: '{cyan-fg}',
  cancelled: '{grey-fg}',
  canceled: '{grey-fg}',
  skipped: '{grey-fg}',
  ready: '{green-fg}',
};

export function colorizeStatus(status: string): string {
  const lower = status.toLowerCase();
  const open = STATUS_COLORS[lower] ?? '{white-fg}';
  const close = open.replace('{', '{/');
  return `${open}${status}{${close.slice(1)}`;
}
