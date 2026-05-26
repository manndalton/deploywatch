import * as blessed from 'blessed';
import {
  WatchlistStore,
  WatchlistItem,
  getWatchlistItems,
  addWatchlistItem,
  removeWatchlistItem,
} from '../history/watchlist';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_REPO = 30;
const COL_ENV = 18;
const COL_LABEL = 16;

export function formatWatchlistRow(item: WatchlistItem): string {
  const repo = pad(item.repo, COL_REPO);
  const env = pad(item.environment ?? '—', COL_ENV);
  const label = pad(item.label ?? '—', COL_LABEL);
  const added = new Date(item.addedAt).toISOString().slice(0, 10);
  return `${repo}${env}${label}${added}`;
}

export function renderWatchlistPanel(
  box: blessed.Widgets.BoxElement,
  store: WatchlistStore
): void {
  const items = getWatchlistItems(store);
  const header =
    '{bold}' +
    pad('Repo', COL_REPO) +
    pad('Environment', COL_ENV) +
    pad('Label', COL_LABEL) +
    'Added' +
    '{/bold}';
  const rows = items.map((i) => formatWatchlistRow(i));
  box.setContent([header, ...rows].join('\n'));
  box.screen.render();
}

export function createWatchlistPanel(
  screen: blessed.Widgets.Screen,
  initialStore: WatchlistStore
): {
  box: blessed.Widgets.BoxElement;
  add: (repo: string, env?: string, label?: string) => void;
  remove: (id: string) => void;
  refresh: () => void;
} {
  let store = initialStore;

  const box = blessed.box({
    top: 0,
    left: 0,
    width: totalWidth,
    height: '100%',
    border: { type: 'line' },
    label: ' Watchlist ',
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
  });

  screen.append(box);
  renderWatchlistPanel(box, store);

  function refresh() {
    renderWatchlistPanel(box, store);
  }

  function add(repo: string, env?: string, label?: string) {
    store = addWatchlistItem(store, repo, env, label);
    refresh();
  }

  function remove(id: string) {
    store = removeWatchlistItem(store, id);
    refresh();
  }

  return { box, add, remove, refresh };
}
