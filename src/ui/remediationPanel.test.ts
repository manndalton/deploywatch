import { colorStatus, formatRemediationRow, renderRemediationPanel } from './remediationPanel';
import {
  emptyRemediationStore,
  createRemediation,
  addRemediation,
  updateRemediationStatus,
} from '../history/remediation';

function makeBox() {
  let content = '';
  return {
    setContent: (s: string) => { content = s; },
    getContent: () => content,
    screen: { render: () => {} },
  } as any;
}

function makeEntry(entryKey = 'repo/main') {
  return createRemediation(entryKey, 'Restart service', 'Restart the failing service', 'bob');
}

describe('colorStatus', () => {
  it('wraps pending in yellow tags', () => {
    expect(colorStatus('pending')).toContain('yellow');
    expect(colorStatus('pending')).toContain('pending');
  });

  it('wraps resolved in green tags', () => {
    expect(colorStatus('resolved')).toContain('green');
  });
});

describe('formatRemediationRow', () => {
  it('includes title and assignee', () => {
    const action = makeEntry();
    const row = formatRemediationRow(action);
    expect(row).toContain('Restart service');
    expect(row).toContain('bob');
  });

  it('shows dash when no assignee', () => {
    const action = createRemediation('k', 'title', 'desc');
    expect(formatRemediationRow(action)).toContain('-');
  });
});

describe('renderRemediationPanel', () => {
  it('shows empty message when no actions', () => {
    const box = makeBox();
    renderRemediationPanel(box, emptyRemediationStore());
    expect(box.getContent()).toContain('No remediation');
  });

  it('renders rows for actions', () => {
    const box = makeBox();
    let store = emptyRemediationStore();
    store = addRemediation(store, makeEntry());
    renderRemediationPanel(box, store);
    expect(box.getContent()).toContain('Restart service');
  });

  it('filters by entryKey when provided', () => {
    const box = makeBox();
    let store = emptyRemediationStore();
    store = addRemediation(store, makeEntry('repo/main'));
    store = addRemediation(store, makeEntry('repo/dev'));
    renderRemediationPanel(box, store, 'repo/dev');
    const content = box.getContent();
    expect(content).toContain('Restart service');
  });

  it('shows resolved status in content', () => {
    const box = makeBox();
    let store = emptyRemediationStore();
    const action = makeEntry();
    store = addRemediation(store, action);
    store = updateRemediationStatus(store, action.id, 'resolved');
    renderRemediationPanel(box, store);
    expect(box.getContent()).toContain('resolved');
  });
});
