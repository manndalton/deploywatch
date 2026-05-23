import { HistoryEntry } from './history';

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: WebhookEvent[];
  label?: string;
}

export type WebhookEvent = 'deploy.success' | 'deploy.failure' | 'deploy.started' | 'deploy.cancelled';

export interface WebhookStore {
  hooks: WebhookConfig[];
}

export interface WebhookPayload {
  event: WebhookEvent;
  entry: HistoryEntry;
  timestamp: string;
}

export function emptyWebhookStore(): WebhookStore {
  return { hooks: [] };
}

export function addWebhook(store: WebhookStore, hook: WebhookConfig): WebhookStore {
  return { hooks: [...store.hooks, hook] };
}

export function removeWebhook(store: WebhookStore, url: string): WebhookStore {
  return { hooks: store.hooks.filter(h => h.url !== url) };
}

export function getWebhooks(store: WebhookStore, event?: WebhookEvent): WebhookConfig[] {
  if (!event) return store.hooks;
  return store.hooks.filter(h => h.events.includes(event));
}

export function buildPayload(event: WebhookEvent, entry: HistoryEntry): WebhookPayload {
  return { event, entry, timestamp: new Date().toISOString() };
}

export function resolveEvent(status: string): WebhookEvent | null {
  switch (status) {
    case 'success': return 'deploy.success';
    case 'failure': case 'error': return 'deploy.failure';
    case 'running': case 'in_progress': return 'deploy.started';
    case 'cancelled': return 'deploy.cancelled';
    default: return null;
  }
}

export async function dispatchWebhook(hook: WebhookConfig, payload: WebhookPayload): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (hook.secret) {
      headers['X-DeployWatch-Secret'] = hook.secret;
    }
    const res = await fetch(hook.url, { method: 'POST', headers, body });
    return res.ok;
  } catch {
    return false;
  }
}

export async function dispatchAll(
  store: WebhookStore,
  event: WebhookEvent,
  entry: HistoryEntry
): Promise<{ url: string; ok: boolean }[]> {
  const hooks = getWebhooks(store, event);
  const payload = buildPayload(event, entry);
  return Promise.all(hooks.map(async h => ({ url: h.url, ok: await dispatchWebhook(h, payload) })));
}
