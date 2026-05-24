import {
  emptyIncidentStore,
  createIncident,
  addIncident,
  resolveIncident,
  updateIncidentStatus,
  getOpenIncidents,
  pruneIncidents,
} from './incidents';
import { HistoryEntry } from './history';

function makeEntry(name: string): HistoryEntry {
  return {
    provider: 'github',
    name,
    status: 'failure',
    timestamp: Date.now(),
    duration: 120,
    branch: 'main',
  };
}

describe('createIncident', () => {
  it('creates an open incident with correct fields', () => {
    const inc = createIncident('Deploy failed', 'high', [makeEntry('api')]);
    expect(inc.title).toBe('Deploy failed');
    expect(inc.severity).toBe('high');
    expect(inc.status).toBe('open');
    expect(inc.entryKeys).toEqual(['github:api']);
    expect(inc.resolvedAt).toBeUndefined();
  });

  it('generates unique ids', () => {
    const a = createIncident('A', 'low');
    const b = createIncident('B', 'low');
    expect(a.id).not.toBe(b.id);
  });
});

describe('addIncident', () => {
  it('appends incident to store', () => {
    const store = emptyIncidentStore();
    const inc = createIncident('Test', 'medium');
    const next = addIncident(store, inc);
    expect(next.incidents).toHaveLength(1);
    expect(next.incidents[0].id).toBe(inc.id);
  });
});

describe('resolveIncident', () => {
  it('sets status to resolved and stamps resolvedAt', () => {
    let store = emptyIncidentStore();
    const inc = createIncident('X', 'critical');
    store = addIncident(store, inc);
    const next = resolveIncident(store, inc.id);
    expect(next.incidents[0].status).toBe('resolved');
    expect(next.incidents[0].resolvedAt).toBeDefined();
  });
});

describe('updateIncidentStatus', () => {
  it('transitions to investigating', () => {
    let store = addIncident(emptyIncidentStore(), createIncident('Y', 'high'));
    const id = store.incidents[0].id;
    store = updateIncidentStatus(store, id, 'investigating');
    expect(store.incidents[0].status).toBe('investigating');
  });
});

describe('getOpenIncidents', () => {
  it('excludes resolved incidents', () => {
    let store = emptyIncidentStore();
    const a = createIncident('A', 'low');
    const b = createIncident('B', 'low');
    store = addIncident(addIncident(store, a), b);
    store = resolveIncident(store, a.id);
    expect(getOpenIncidents(store).map(i => i.id)).toEqual([b.id]);
  });
});

describe('pruneIncidents', () => {
  it('removes old resolved incidents', () => {
    const old: any = { ...createIncident('old', 'low'), status: 'resolved', resolvedAt: Date.now() - 10 * 86_400_000 };
    const fresh: any = { ...createIncident('fresh', 'low'), status: 'resolved', resolvedAt: Date.now() };
    const open = createIncident('open', 'high');
    const store = { incidents: [old, fresh, open] };
    const pruned = pruneIncidents(store, 7);
    expect(pruned.incidents.map((i: any) => i.title)).toEqual(['fresh', 'open']);
  });
});
