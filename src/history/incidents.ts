import { HistoryEntry } from './history';

export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  entryKeys: string[];
  createdAt: number;
  resolvedAt?: number;
  notes: string;
}

export interface IncidentStore {
  incidents: Incident[];
}

export function emptyIncidentStore(): IncidentStore {
  return { incidents: [] };
}

export function generateIncidentId(): string {
  return `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createIncident(
  title: string,
  severity: Incident['severity'],
  entries: HistoryEntry[] = []
): Incident {
  return {
    id: generateIncidentId(),
    title,
    severity,
    status: 'open',
    entryKeys: entries.map(e => `${e.provider}:${e.name}`),
    createdAt: Date.now(),
    notes: '',
  };
}

export function addIncident(store: IncidentStore, incident: Incident): IncidentStore {
  return { incidents: [...store.incidents, incident] };
}

export function resolveIncident(store: IncidentStore, id: string): IncidentStore {
  return {
    incidents: store.incidents.map(i =>
      i.id === id ? { ...i, status: 'resolved', resolvedAt: Date.now() } : i
    ),
  };
}

export function updateIncidentStatus(
  store: IncidentStore,
  id: string,
  status: Incident['status']
): IncidentStore {
  return {
    incidents: store.incidents.map(i => (i.id === id ? { ...i, status } : i)),
  };
}

export function getOpenIncidents(store: IncidentStore): Incident[] {
  return store.incidents.filter(i => i.status !== 'resolved');
}

export function pruneIncidents(store: IncidentStore, maxAgeDays: number): IncidentStore {
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  return {
    incidents: store.incidents.filter(
      i => i.status !== 'resolved' || (i.resolvedAt ?? 0) >= cutoff
    ),
  };
}
