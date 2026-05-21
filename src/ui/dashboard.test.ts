import { formatRow } from './formatRow';
import { colorizeStatus, totalWidth, COLUMN_WIDTHS } from './layout';

describe('formatRow', () => {
  it('pads short values to column width', () => {
    const row = formatRow(['github', 'my-repo', 'main', 'success', '12:00'], COLUMN_WIDTHS, false);
    // provider column should be padded to 10 chars (before tags)
    expect(row).toContain('github    ');
  });

  it('truncates long values with ellipsis', () => {
    const longName = 'a-very-long-repository-name-that-exceeds-limit';
    const row = formatRow(['github', longName, 'main', 'success', '12:00'], COLUMN_WIDTHS, false);
    expect(row).toContain('…');
  });

  it('wraps header cells in bold tags', () => {
    const row = formatRow(['Provider', 'Repo', 'Branch', 'Status', 'Updated'], COLUMN_WIDTHS, true);
    expect(row).toContain('{bold}');
    expect(row).toContain('{/bold}');
  });

  it('colorizes known status values', () => {
    const row = formatRow(['vercel', 'proj', 'main', 'failure', '12:00'], COLUMN_WIDTHS, false);
    expect(row).toContain('{red-fg}');
  });

  it('does not colorize header status cell', () => {
    const row = formatRow(['Provider', 'Repo', 'Branch', 'Status', 'Updated'], COLUMN_WIDTHS, true);
    expect(row).not.toContain('{red-fg}');
    expect(row).not.toContain('{green-fg}');
  });
});

describe('colorizeStatus', () => {
  it('returns green for success', () => {
    expect(colorizeStatus('success')).toContain('{green-fg}');
  });

  it('returns red for failure', () => {
    expect(colorizeStatus('failure')).toContain('{red-fg}');
  });

  it('returns yellow for in_progress', () => {
    expect(colorizeStatus('in_progress')).toContain('{yellow-fg}');
  });

  it('defaults to white for unknown status', () => {
    expect(colorizeStatus('unknown_state')).toContain('{white-fg}');
  });
});

describe('totalWidth', () => {
  it('sums widths plus separators', () => {
    expect(totalWidth([10, 20, 10])).toBe(42); // 10+20+10 + 2 separators
  });

  it('handles single column', () => {
    expect(totalWidth([15])).toBe(15);
  });
});
