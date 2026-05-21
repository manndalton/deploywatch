import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Poller } from './poller';
import type { Deployment, DeploymentProvider } from '../providers/types';

const mockDeployment: Deployment = {
  id: 'abc123',
  name: 'my-app',
  status: 'success',
  branch: 'main',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:01:00Z'),
  provider: 'github',
};

function makeProvider(name: string, deployments: Deployment[] = [mockDeployment]): DeploymentProvider {
  return {
    name,
    fetchDeployments: vi.fn().mockResolvedValue(deployments),
  };
}

describe('Poller', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits update after pollOnce', async () => {
    const poller = new Poller(5_000);
    const provider = makeProvider('github');
    const updates: unknown[] = [];
    poller.on('update', (r) => updates.push(r));
    await poller.pollOnce(provider);
    expect(updates).toHaveLength(1);
    expect((updates[0] as { provider: string }).provider).toBe('github');
  });

  it('emits error when provider throws', async () => {
    const provider: DeploymentProvider = {
      name: 'broken',
      fetchDeployments: vi.fn().mockRejectedValue(new Error('network error')),
    };
    const poller = new Poller();
    const errors: unknown[] = [];
    poller.on('error', (r) => errors.push(r));
    const result = await poller.pollOnce(provider);
    expect(result.error?.message).toBe('network error');
    expect(errors).toHaveLength(1);
  });

  it('isRunning reflects state', () => {
    const poller = new Poller(1_000);
    poller.register(makeProvider('vercel'));
    expect(poller.isRunning).toBe(false);
    poller.start();
    expect(poller.isRunning).toBe(true);
    poller.stop();
    expect(poller.isRunning).toBe(false);
  });

  it('polls on interval', async () => {
    const provider = makeProvider('github');
    const poller = new Poller(1_000);
    poller.register(provider);
    poller.start();
    await vi.runAllTimersAsync();
    poller.stop();
    expect(provider.fetchDeployments).toHaveBeenCalledTimes(1);
  });
});
