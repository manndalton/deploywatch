import { formatSnapshotRow, renderSnapshotsPanel, createSnapshotsPanel, refresh } from './snapshotsPanel';
import { createSnapshot, Snapshot } from '../history/snapshots';
import { HistoryEntry } from '../history/history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    finishedAt: new Date('2024-01-01T10:05:00Z').toISOString(),
    durationMs: 300000,
    tags: [],
    ...overrides,
  };
}

function makeBox() {
  return {
    setContent: jest.fn(),
    append: jest.fn(),
    screen: { render: jest.fn() },
  } as any;
}

describe('formatSnapshotRow', () => {
  it('includes id, label, count, and date', () => {
    const snap = createSnapshot([makeEntry(), makeEntry({ id: 'e2' })], 'my-label');
    const row = formatSnapshotRow(snap);
    expect(row).toContain('my-label');
    expect(row).toContain('2');
    expect(row).toContain(snap.id);
  });

  it('shows (unlabelled) when no label', () => {
    const snap = createSnapshot([makeEntry()]);
    const row = formatSnapshotRow(snap);
    expect(row).toContain('(unlabelled)');
  });
});

describe('renderSnapshotsPanel', () => {
  it('calls setContent and render', () => {
    const box = makeBox();
    const snap = createSnapshot([makeEntry()], 'test');
    renderSnapshotsPanel(box, [snap], [makeEntry()]);
    expect(box.setContent).toHaveBeenCalledTimes(1);
    expect(box.screen.render).toHaveBeenCalledTimes(1);
  });

  it('marks snapshots with changes with an asterisk', () => {
    const box = makeBox();
    const snap = createSnapshot([makeEntry({ status: 'in_progress' })], 'old');
    const current = [makeEntry({ status: 'success' })];
    renderSnapshotsPanel(box, [snap], current);
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain('*');
  });

  it('renders empty list without error', () => {
    const box = makeBox();
    renderSnapshotsPanel(box, [], []);
    expect(box.setContent).toHaveBeenCalledTimes(1);
  });
});

describe('refresh', () => {
  it('delegates to renderSnapshotsPanel', () => {
    const box = makeBox();
    const snap = createSnapshot([makeEntry()], 'r');
    refresh(box, [snap], [makeEntry()]);
    expect(box.setContent).toHaveBeenCalledTimes(1);
  });
});
