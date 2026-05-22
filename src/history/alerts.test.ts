import {
  emptyAlertStore,
  createAlert,
  addAlert,
  acknowledgeAlert,
  removeAlert,
  getUnacknowledged,
  pruneAlerts,
  severityFromStatus,
} from './alerts';
import { HistoryEntry } from './index';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'run-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'failure',
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-01T00:05:00Z',
    durationMs: 300000,
    tags: [],
    ...overrides,
  };
}

test('emptyAlertStore returns empty alerts array', () => {
  expect(emptyAlertStore()).toEqual({ alerts: [] });
});

test('createAlert builds alert from entry', () => {
  const entry = makeEntry();
  const alert = createAlert(entry, 'critical', 'Build failed');
  expect(alert.entryKey).toBe('github:org/repo:run-1');
  expect(alert.severity).toBe('critical');
  expect(alert.message).toBe('Build failed');
  expect(alert.acknowledgedAt).toBeUndefined();
});

test('addAlert appends to store', () => {
  const store = emptyAlertStore();
  const alert = createAlert(makeEntry(), 'warning', 'Cancelled');
  const updated = addAlert(store, alert);
  expect(updated.alerts).toHaveLength(1);
});

test('acknowledgeAlert sets acknowledgedAt', () => {
  let store = emptyAlertStore();
  const alert = createAlert(makeEntry(), 'critical', 'Failed');
  store = addAlert(store, alert);
  const acked = acknowledgeAlert(store, alert.id);
  expect(acked.alerts[0].acknowledgedAt).toBeDefined();
});

test('removeAlert removes by id', () => {
  let store = emptyAlertStore();
  const alert = createAlert(makeEntry(), 'info', 'Done');
  store = addAlert(store, alert);
  const updated = removeAlert(store, alert.id);
  expect(updated.alerts).toHaveLength(0);
});

test('getUnacknowledged filters acknowledged', () => {
  let store = emptyAlertStore();
  const a1 = createAlert(makeEntry({ id: 'r1' }), 'critical', 'Fail');
  const a2 = createAlert(makeEntry({ id: 'r2' }), 'info', 'OK');
  store = addAlert(addAlert(store, a1), a2);
  store = acknowledgeAlert(store, a2.id);
  expect(getUnacknowledged(store)).toHaveLength(1);
  expect(getUnacknowledged(store)[0].id).toBe(a1.id);
});

test('pruneAlerts removes old acknowledged alerts', () => {
  let store = emptyAlertStore();
  const old = { ...createAlert(makeEntry(), 'info', 'Old'), createdAt: new Date(Date.now() - 100000).toISOString(), acknowledgedAt: new Date().toISOString() };
  const fresh = createAlert(makeEntry({ id: 'r2' }), 'critical', 'New');
  store = addAlert(addAlert(store, old), fresh);
  const pruned = pruneAlerts(store, 50000);
  expect(pruned.alerts.map((a) => a.id)).not.toContain(old.id);
  expect(pruned.alerts.map((a) => a.id)).toContain(fresh.id);
});

test('severityFromStatus maps correctly', () => {
  expect(severityFromStatus('failure')).toBe('critical');
  expect(severityFromStatus('error')).toBe('critical');
  expect(severityFromStatus('cancelled')).toBe('warning');
  expect(severityFromStatus('success')).toBe('info');
});
