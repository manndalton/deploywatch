import {
  emptyCorrelationStore,
  createCorrelationGroup,
  addCorrelation,
  removeCorrelation,
  getCorrelationById,
  findGroupsForEntry,
  resolveCorrelatedEntries,
} from './correlation';
import { HistoryEntry } from './history';

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    status: 'success',
    timestamp: Date.now(),
    duration: 60,
    branch: 'main',
    tags: [],
  };
}

describe('correlation', () => {
  it('starts empty', () => {
    const store = emptyCorrelationStore();
    expect(store.groups).toHaveLength(0);
  });

  it('creates a group with unique id', () => {
    const g1 = createCorrelationGroup('release-1.2', ['e1', 'e2']);
    const g2 = createCorrelationGroup('release-1.3', ['e3']);
    expect(g1.id).not.toBe(g2.id);
    expect(g1.label).toBe('release-1.2');
    expect(g1.entryIds).toEqual(['e1', 'e2']);
  });

  it('adds a group immutably', () => {
    const store = emptyCorrelationStore();
    const g = createCorrelationGroup('deploy', ['e1']);
    const next = addCorrelation(store, g);
    expect(next.groups).toHaveLength(1);
    expect(store.groups).toHaveLength(0);
  });

  it('removes a group by id', () => {
    let store = emptyCorrelationStore();
    const g = createCorrelationGroup('deploy', ['e1']);
    store = addCorrelation(store, g);
    store = removeCorrelation(store, g.id);
    expect(store.groups).toHaveLength(0);
  });

  it('getCorrelationById returns correct group', () => {
    let store = emptyCorrelationStore();
    const g = createCorrelationGroup('test', ['e1']);
    store = addCorrelation(store, g);
    expect(getCorrelationById(store, g.id)).toEqual(g);
    expect(getCorrelationById(store, 'missing')).toBeUndefined();
  });

  it('findGroupsForEntry returns all groups containing entry', () => {
    let store = emptyCorrelationStore();
    const g1 = createCorrelationGroup('a', ['e1', 'e2']);
    const g2 = createCorrelationGroup('b', ['e2', 'e3']);
    store = addCorrelation(addCorrelation(store, g1), g2);
    const groups = findGroupsForEntry(store, 'e2');
    expect(groups).toHaveLength(2);
    expect(findGroupsForEntry(store, 'e1')).toHaveLength(1);
  });

  it('resolveCorrelatedEntries returns matching entries', () => {
    let store = emptyCorrelationStore();
    const g = createCorrelationGroup('rel', ['e1', 'e3']);
    store = addCorrelation(store, g);
    const entries = ['e1', 'e2', 'e3', 'e4'].map(makeEntry);
    const resolved = resolveCorrelatedEntries(store, g.id, entries);
    expect(resolved.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('resolveCorrelatedEntries returns empty for unknown group', () => {
    const store = emptyCorrelationStore();
    const result = resolveCorrelatedEntries(store, 'nope', [makeEntry('e1')]);
    expect(result).toHaveLength(0);
  });
});
