import * as blessed from 'blessed';
import {
  WebhookStore,
  WebhookConfig,
  WebhookEvent,
  addWebhook,
  removeWebhook,
  getWebhooks,
} from '../history/webhooks';
import { pad } from './formatRow';
import { totalWidth } from './layout';

const COL_LABEL = 18;
const COL_URL = 36;
const COL_EVENTS = totalWidth - COL_LABEL - COL_URL - 4;

export function formatWebhookRow(hook: WebhookConfig): string {
  const label = pad(hook.label ?? '—', COL_LABEL);
  const url = pad(hook.url.replace(/^https?:\/\//, ''), COL_URL);
  const events = pad(hook.events.join(', '), COL_EVENTS);
  return `${label} ${url} ${events}`;
}

export function renderWebhooksPanel(store: WebhookStore, box: blessed.Widgets.BoxElement): void {
  const hooks = getWebhooks(store);
  const header = `{bold}${pad('Label', COL_LABEL)} ${pad('URL', COL_URL)} ${pad('Events', COL_EVENTS)}{/bold}`;
  if (hooks.length === 0) {
    box.setContent(`${header}\n\n  {gray-fg}No webhooks configured.{/gray-fg}`);
  } else {
    const rows = hooks.map(formatWebhookRow).join('\n');
    box.setContent(`${header}\n${rows}`);
  }
  box.screen.render();
}

export function createWebhooksPanel(
  screen: blessed.Widgets.Screen,
  initialStore: WebhookStore
) {
  let store = initialStore;

  const box = blessed.box({
    label: ' Webhooks ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
  });

  screen.append(box);
  renderWebhooksPanel(store, box);

  function refresh(next: WebhookStore) {
    store = next;
    renderWebhooksPanel(store, box);
  }

  function addHook(hook: WebhookConfig) {
    refresh(addWebhook(store, hook));
    return store;
  }

  function removeHook(url: string) {
    refresh(removeWebhook(store, url));
    return store;
  }

  return { box, refresh, addHook, removeHook, getStore: () => store };
}
