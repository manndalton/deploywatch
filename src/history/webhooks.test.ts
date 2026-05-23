import {
  emptyWebhookStore,
  addWebhook,
  removeWebhook,
  getWebhooks,
  buildPayload,
  resolveEvent,
  dispatchAll,
  WebhookConfig,
} from './webhooks';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'entry-1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-01T00:05:00Z',
    durationMs: 300000,
    ...overrides,
  };
}

const hookA: WebhookConfig = { url: 'https://a.example.com/hook', events: ['deploy.success'] };
const hookB: WebhookConfig = { url: 'https://b.example.com/hook', events: ['deploy.failure', 'deploy.success'], secret: 'abc' };

describe('webhooks store', () => {
  it('starts empty', () => {
    expect(emptyWebhookStore().hooks).toHaveLength(0);
  });

  it('adds and retrieves hooks', () => {
    const store = addWebhook(addWebhook(emptyWebhookStore(), hookA), hookB);
    expect(store.hooks).toHaveLength(2);
  });

  it('removes a hook by url', () => {
    const store = removeWebhook(addWebhook(addWebhook(emptyWebhookStore(), hookA), hookB), hookA.url);
    expect(store.hooks).toHaveLength(1);
    expect(store.hooks[0].url).toBe(hookB.url);
  });

  it('filters hooks by event', () => {
    const store = addWebhook(addWebhook(emptyWebhookStore(), hookA), hookB);
    expect(getWebhooks(store, 'deploy.failure')).toHaveLength(1);
    expect(getWebhooks(store, 'deploy.success')).toHaveLength(2);
  });
});

describe('buildPayload', () => {
  it('includes event and entry', () => {
    const entry = makeEntry();
    const payload = buildPayload('deploy.success', entry);
    expect(payload.event).toBe('deploy.success');
    expect(payload.entry).toBe(entry);
    expect(payload.timestamp).toBeTruthy();
  });
});

describe('resolveEvent', () => {
  it('maps known statuses', () => {
    expect(resolveEvent('success')).toBe('deploy.success');
    expect(resolveEvent('failure')).toBe('deploy.failure');
    expect(resolveEvent('running')).toBe('deploy.started');
    expect(resolveEvent('cancelled')).toBe('deploy.cancelled');
  });

  it('returns null for unknown status', () => {
    expect(resolveEvent('queued')).toBeNull();
  });
});

describe('dispatchAll', () => {
  it('returns results for each matching hook', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;
    const store = addWebhook(emptyWebhookStore(), hookA);
    const results = await dispatchAll(store, 'deploy.success', makeEntry());
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(true);
  });

  it('returns ok:false on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as jest.Mock;
    const store = addWebhook(emptyWebhookStore(), hookA);
    const results = await dispatchAll(store, 'deploy.success', makeEntry());
    expect(results[0].ok).toBe(false);
  });
});
