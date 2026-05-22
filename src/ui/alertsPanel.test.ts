import { formatAlertRow, colorSeverity } from './alertsPanel';
import { Alert, AlertStore, createAlert, addAlert, emptyAlertStore } from '../history/alerts';
import { HistoryEntry } from '../history/index';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'run-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'failure',
    startedAt: '2024-06-01T12:00:00Z',
    finishedAt: '2024-06-01T12:05:00Z',
    durationMs: 300000,
    tags: [],
    ...overrides,
  };
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert-1',
    entryKey: 'github:org/repo:run-1',
    severity: 'critical',
    message: 'Build failed on main',
    createdAt: '2024-06-01T12:05:00Z',
    ...overrides,
  };
}

test('colorSeverity wraps text with color tags', () => {
  const result = colorSeverity('critical', 'CRITICAL');
  expect(result).toContain('CRITICAL');
  expect(result).toContain('{red-fg}');
});

test('colorSeverity warning uses yellow', () => {
  expect(colorSeverity('warning', 'WARN')).toContain('{yellow-fg}');
});

test('colorSeverity info uses cyan', () => {
  expect(colorSeverity('info', 'INFO')).toContain('{cyan-fg}');
});

test('formatAlertRow includes time and message', () => {
  const alert = makeAlert();
  const row = formatAlertRow(alert, 80);
  expect(row).toContain('12:05:00');
  expect(row).toContain('Build failed on main');
});

test('formatAlertRow shows ack marker when acknowledged', () => {
  const alert = makeAlert({ acknowledgedAt: '2024-06-01T12:10:00Z' });
  const row = formatAlertRow(alert, 80);
  expect(row).toContain('[ack]');
});

test('formatAlertRow no ack marker when unacknowledged', () => {
  const alert = makeAlert();
  const row = formatAlertRow(alert, 80);
  expect(row).not.toContain('[ack]');
});

test('formatAlertRow truncates long messages', () => {
  const msg = 'A'.repeat(200);
  const alert = makeAlert({ message: msg });
  const row = formatAlertRow(alert, 60);
  // row should not exceed reasonable length
  expect(row.replace(/\{[^}]+\}/g, '').length).toBeLessThan(200);
});
