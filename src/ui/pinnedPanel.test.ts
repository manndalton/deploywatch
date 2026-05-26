import { formatPinnedRow, renderPinnedPanel } from './pinnedPanel';
import { emptyPinnedStore, addPin, PinnedStore } from '../history/pinned';

function makeBox() {
  let content = '';
  return {
    setContent: (s: string) => { content = s; },
    getContent: () => content,
    screen: { render: () => {} },
  } as any;
}

function makeEntry(entryKey: string, label: string, note?: string) {
  return {
    id: 'pin_test',
    entryKey,
    label,
    pinnedAt: new Date('2024-06-01T12:00:00Z').getTime(),
    note,
  };
}

describe('formatPinnedRow', () => {
  it('formats a pin with note', () => {
    const row = formatPinnedRow(makeEntry('gh:myrepo:42', 'My Deploy', 'hotfix'));
    expect(row).toContain('My Deploy');
    expect(row).toContain('gh:myrepo:42');
    expect(row).toContain('hotfix');
    expect(row).toContain('2024-06-01');
  });

  it('formats a pin without note', () => {
    const row = formatPinnedRow(makeEntry('gh:myrepo:43', 'No Note'));
    expect(row).toContain('No Note');
    expect(row).toContain('gh:myrepo:43');
  });
});

describe('renderPinnedPanel', () => {
  it('renders empty message when no pins', () => {
    const box = makeBox();
    renderPinnedPanel(box, emptyPinnedStore());
    expect(box.getContent()).toContain('No pinned entries');
  });

  it('renders pinned entries', () => {
    const store: PinnedStore = addPin(
      addPin(emptyPinnedStore(), 'key-1', 'Deploy Alpha', 'critical'),
      'key-2',
      'Deploy Beta'
    );
    const box = makeBox();
    renderPinnedPanel(box, store);
    const content = box.getContent();
    expect(content).toContain('Deploy Alpha');
    expect(content).toContain('Deploy Beta');
    expect(content).toContain('critical');
  });

  it('renders header row', () => {
    const box = makeBox();
    renderPinnedPanel(box, emptyPinnedStore());
    expect(box.getContent()).toContain('Label');
    expect(box.getContent()).toContain('Entry Key');
  });
});
