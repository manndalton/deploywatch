import { formatBaselineRow, renderBaselinesPanel, renderComparisonPanel } from './baselinePanel';
import { createBaseline, emptyBaselineStore, addBaseline } from '../history/baseline';
import { HistoryEntry } from '../history/history';

function makeEntry(id: string, status: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status,
    startedAt: Date.now(),
    duration: 60,
    tags: [],
  } as unknown as HistoryEntry;
}

function makeBox(): any {
  let content = '';
  return {
    setContent: (c: string) => { content = c; },
    getContent: () => content,
    screen: { render: jest.fn() },
  };
}

describe('formatBaselineRow', () => {
  it('includes id, label and entry count', () => {
    const b = createBaseline('release-1.0', [makeEntry('e1', 'success')]);
    const row = formatBaselineRow(b);
    expect(row).toContain('release-1.0');
    expect(row).toContain('entries:');
    expect(row).toContain('1');
  });
});

describe('renderBaselinesPanel', () => {
  it('shows empty message when no baselines', () => {
    const box = makeBox();
    renderBaselinesPanel(emptyBaselineStore(), box as any);
    expect(box.getContent()).toContain('No baselines');
  });

  it('renders rows for each baseline', () => {
    let store = emptyBaselineStore();
    store = addBaseline(store, createBaseline('v1', [makeEntry('e1', 'success')]));
    store = addBaseline(store, createBaseline('v2', []));
    const box = makeBox();
    renderBaselinesPanel(store, box as any);
    const content = box.getContent();
    expect(content).toContain('v1');
    expect(content).toContain('v2');
    expect(content).toContain('LABEL');
  });
});

describe('renderComparisonPanel', () => {
  it('shows error when baseline not found', () => {
    const box = makeBox();
    renderComparisonPanel(emptyBaselineStore(), 'missing', [], box as any);
    expect(box.getContent()).toContain('not found');
  });

  it('shows added, removed, and changed entries', () => {
    let store = emptyBaselineStore();
    const e1 = makeEntry('e1', 'success');
    const e2 = makeEntry('e2', 'failure');
    const baseline = createBaseline('base', [e1, e2]);
    store = addBaseline(store, baseline);
    const e2updated = { ...e2, status: 'success' };
    const e3 = makeEntry('e3', 'success');
    const box = makeBox();
    renderComparisonPanel(store, baseline.id, [e1, e2updated, e3], box as any);
    const content = box.getContent();
    expect(content).toContain('Added');
    expect(content).toContain('Removed');
    expect(content).toContain('Changed');
    expect(content).toContain('e3');
  });
});
