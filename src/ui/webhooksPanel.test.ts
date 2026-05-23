import { formatWebhookRow, renderWebhooksPanel } from './webhooksPanel';
import { emptyWebhookStore, addWebhook, WebhookConfig, WebhookStore } from '../history/webhooks';

function makeBox() {
  let content = '';
  return {
    setContent: (s: string) => { content = s; },
    getContent: () => content,
    screen: { render: jest.fn() },
  } as any;
}

const hookA: WebhookConfig = {
  url: 'https://hooks.example.com/deploy',
  events: ['deploy.success', 'deploy.failure'],
  label: 'CI Alerts',
};

const hookB: WebhookConfig = {
  url: 'https://other.example.com/notify',
  events: ['deploy.started'],
};

describe('formatWebhookRow', () => {
  it('includes label, url and events', () => {
    const row = formatWebhookRow(hookA);
    expect(row).toContain('CI Alerts');
    expect(row).toContain('hooks.example.com/deploy');
    expect(row).toContain('deploy.success');
  });

  it('uses dash for missing label', () => {
    const row = formatWebhookRow(hookB);
    expect(row).toContain('—');
  });

  it('strips protocol from url', () => {
    const row = formatWebhookRow(hookA);
    expect(row).not.toContain('https://');
  });
});

describe('renderWebhooksPanel', () => {
  it('shows empty message when no hooks', () => {
    const box = makeBox();
    renderWebhooksPanel(emptyWebhookStore(), box);
    expect(box.getContent()).toContain('No webhooks configured');
  });

  it('renders rows for each hook', () => {
    const box = makeBox();
    const store = addWebhook(addWebhook(emptyWebhookStore(), hookA), hookB);
    renderWebhooksPanel(store, box);
    expect(box.getContent()).toContain('CI Alerts');
    expect(box.getContent()).toContain('other.example.com/notify');
  });

  it('renders header', () => {
    const box = makeBox();
    renderWebhooksPanel(emptyWebhookStore(), box);
    expect(box.getContent()).toContain('Label');
    expect(box.getContent()).toContain('URL');
    expect(box.getContent()).toContain('Events');
  });
});
