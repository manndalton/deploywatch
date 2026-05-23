import {
  emptyMilestoneStore,
  createMilestone,
  addMilestone,
  removeMilestone,
  listMilestones,
  findMilestoneByLabel,
  findMilestonesByEntry,
} from './milestones';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    provider: 'github',
    repo: 'org/repo',
    runId: 'run-1',
    status: 'success',
    branch: 'main',
    timestamp: new Date().toISOString(),
    duration: 120,
    ...overrides,
  };
}

describe('milestones', () => {
  it('starts with an empty store', () => {
    expect(emptyMilestoneStore().milestones).toHaveLength(0);
  });

  it('creates a milestone from an entry', () => {
    const entry = makeEntry();
    const ms = createMilestone(entry, 'v1.0 release', 'First stable release');
    expect(ms.label).toBe('v1.0 release');
    expect(ms.note).toBe('First stable release');
    expect(ms.entryKey).toBe('github:org/repo:run-1');
    expect(ms.id).toMatch(/^ms_/);
  });

  it('adds a milestone to the store', () => {
    const store = emptyMilestoneStore();
    const ms = createMilestone(makeEntry(), 'deploy-prod');
    const updated = addMilestone(store, ms);
    expect(updated.milestones).toHaveLength(1);
  });

  it('removes a milestone by id', () => {
    let store = emptyMilestoneStore();
    const ms = createMilestone(makeEntry(), 'to-remove');
    store = addMilestone(store, ms);
    const updated = removeMilestone(store, ms.id);
    expect(updated.milestones).toHaveLength(0);
  });

  it('lists milestones sorted newest first', () => {
    let store = emptyMilestoneStore();
    const ms1 = { ...createMilestone(makeEntry(), 'first'), createdAt: '2024-01-01T00:00:00Z' };
    const ms2 = { ...createMilestone(makeEntry(), 'second'), createdAt: '2024-06-01T00:00:00Z' };
    store = addMilestone(addMilestone(store, ms1), ms2);
    const list = listMilestones(store);
    expect(list[0].label).toBe('second');
  });

  it('finds a milestone by label (case-insensitive)', () => {
    let store = emptyMilestoneStore();
    const ms = createMilestone(makeEntry(), 'Release Candidate');
    store = addMilestone(store, ms);
    expect(findMilestoneByLabel(store, 'release candidate')).toBeDefined();
    expect(findMilestoneByLabel(store, 'unknown')).toBeUndefined();
  });

  it('finds milestones by entry', () => {
    let store = emptyMilestoneStore();
    const entry = makeEntry({ runId: 'run-42' });
    const ms = createMilestone(entry, 'tagged');
    store = addMilestone(store, ms);
    const found = findMilestonesByEntry(store, entry);
    expect(found).toHaveLength(1);
    expect(findMilestonesByEntry(store, makeEntry({ runId: 'other' }))).toHaveLength(0);
  });
});
