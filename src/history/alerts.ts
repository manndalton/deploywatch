import { HistoryEntry } from './index';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  entryKey: string;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface AlertStore {
  alerts: Alert[];
}

export function emptyAlertStore(): AlertStore {
  return { alerts: [] };
}

export function createAlert(
  entry: HistoryEntry,
  severity: AlertSeverity,
  message: string
): Alert {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entryKey: `${entry.provider}:${entry.repo}:${entry.id}`,
    severity,
    message,
    createdAt: new Date().toISOString(),
  };
}

export function addAlert(store: AlertStore, alert: Alert): AlertStore {
  return { alerts: [...store.alerts, alert] };
}

export function acknowledgeAlert(store: AlertStore, id: string): AlertStore {
  return {
    alerts: store.alerts.map((a) =>
      a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a
    ),
  };
}

export function removeAlert(store: AlertStore, id: string): AlertStore {
  return { alerts: store.alerts.filter((a) => a.id !== id) };
}

export function getUnacknowledged(store: AlertStore): Alert[] {
  return store.alerts.filter((a) => !a.acknowledgedAt);
}

export function pruneAlerts(store: AlertStore, maxAge: number): AlertStore {
  const cutoff = Date.now() - maxAge;
  return {
    alerts: store.alerts.filter(
      (a) => new Date(a.createdAt).getTime() > cutoff || !a.acknowledgedAt
    ),
  };
}

export function severityFromStatus(status: string): AlertSeverity {
  if (status === 'failure' || status === 'error') return 'critical';
  if (status === 'cancelled' || status === 'timed_out') return 'warning';
  return 'info';
}
