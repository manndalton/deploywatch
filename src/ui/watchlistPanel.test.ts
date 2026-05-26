import {
  formatWatchlistRow,
  renderWatchlistPanel,
  createWatchlistPanel,
} from './watchlistPanel';
import {
  emptyWatchlistStore,
  addWatchlistItem,
  WatchlistItem,
} from '../history/watchlist';

function makeItem(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: 'wl_test_1',
    repo: 'org/myrepo',
    environment: 'production',
    label: 'Prod',
    addedAt: new Date('2024-03-15T10:00:00Z').getTime(),
    ...overrides,
  };
}

function makeBox() {
  let content = '';
  return {
    setContent: (s: string) => { content = s; },
    getContent: () => content,
    screen: { render: jest.fn() },
  } as any;
}

describe('formatWatchlistRow', () => {
  it('formats a full item', () => {
    const row = formatWatchlistRow(makeItem());
    expect(row).toContain('org/myrepo');
    expect(row).toContain('production');
    expect(row).toContain('Prod');
    expect(row).toContain('2024-03-15');
  });

  it('uses dash for missing environment and label', () => {
    const row = formatWatchlistRow(makeItem({ environment: undefined, label: undefined }));
    expect(row).toContain('—');
  });
});

describe('renderWatchlistPanel', () => {
  it('renders header and rows', () => {
    let store = emptyWatchlistStore();
    store = addWatchlistItem(store, 'org/alpha', 'staging', 'Staging');
    const box = makeBox();
    renderWatchlistPanel(box, store);
    const content = box.getContent();
    expect(content).toContain('Repo');
    expect(content).toContain('org/alpha');
    expect(content).toContain('staging');
  });

  it('renders empty state gracefully', () => {
    const store = emptyWatchlistStore();
    const box = makeBox();
    renderWatchlistPanel(box, store);
    expect(box.getContent()).toContain('Repo');
  });
});

describe('createWatchlistPanel', () => {
  function makeScreen() {
    return { append: jest.fn(), render: jest.fn() } as any;
  }

  it('add and remove update panel', () => {
    const screen = makeScreen();
    const { add, remove, box } = createWatchlistPanel(screen, emptyWatchlistStore());
    add('org/beta', 'production', 'Beta');
    expect(box.getContent()).toContain('org/beta');
    // find id from content indirectly via remove
    // we just ensure remove doesn't throw
    expect(() => remove('nonexistent')).not.toThrow();
  });
});
