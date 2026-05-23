import { formatMilestoneRow, renderMilestonesPanel } from './milestonesPanel';
import {
  emptyMilestoneStore,
  addMilestone,
  createMilestone,
  MilestoneStore,
} from '../history/milestones';
import { HistoryEntry } from '../history/history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    provider: 'vercel',
    repo: 'org/frontend',
    runId: 'dpl-99',
    status: 'success',
    branch: 'main',
    timestamp: '2024-05-01T12:00:00Z',
    duration: 90,
    ...overrides,
  };
}

function makeBox() {
  let content = '';
  return {
    setContent: (s: string) => { content = s; },
    getContent: () => content,
  } as any;
}

describe('formatMilestoneRow', () => {
  it('includes label, entry key, and date', () => {
    const entry = makeEntry();
    const ms = createMilestone(entry, 'v2.0');
    const row = formatMilestoneRow(ms);
    expect(row).toContain('v2.0');
    expect(row).toContain('vercel:org/frontend:dpl-99');
  });

  it('includes note when present', () => {
    const ms = createMilestone(makeEntry(), 'hotfix', 'urgent patch');
    const row = formatMilestoneRow(ms);
    expect(row).toContain('urgent patch');
  });

  it('formats date as YYYY-MM-DD HH:MM', () => {
    const ms = {
      ...createMilestone(makeEntry(), 'dated'),
      createdAt: '2024-03-15T09:45:00Z',
    };
    const row = formatMilestoneRow(ms);
    expect(row).toContain('2024-03-15 09:45');
  });
});

describe('renderMilestonesPanel', () => {
  it('shows empty message when store has no milestones', () => {
    const box = makeBox();
    renderMilestonesPanel(box, emptyMilestoneStore());
    expect(box.getContent()).toContain('No milestones');
  });

  it('renders header and rows for milestones', () => {
    let store: MilestoneStore = emptyMilestoneStore();
    store = addMilestone(store, createMilestone(makeEntry(), 'prod-deploy'));
    const box = makeBox();
    renderMilestonesPanel(box, store);
    const content = box.getContent();
    expect(content).toContain('Label');
    expect(content).toContain('prod-deploy');
  });

  it('renders multiple milestones', () => {
    let store: MilestoneStore = emptyMilestoneStore();
    store = addMilestone(store, createMilestone(makeEntry(), 'alpha'));
    store = addMilestone(store, createMilestone(makeEntry({ runId: 'dpl-100' }), 'beta'));
    const box = makeBox();
    renderMilestonesPanel(box, store);
    const content = box.getContent();
    expect(content).toContain('alpha');
    expect(content).toContain('beta');
  });
});
