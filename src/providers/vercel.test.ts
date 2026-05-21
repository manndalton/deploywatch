import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statusLabel, fetchDeployments, DeploymentState } from './vercel';
import type { VercelConfig } from './vercel.config';

const mockConfig: VercelConfig = { token: 'test-token-123' };

describe('statusLabel', () => {
  it.each([
    ['BUILDING', '🔨 Building'],
    ['ERROR', '❌ Error'],
    ['INITIALIZING', '⏳ Initializing'],
    ['QUEUED', '🕐 Queued'],
    ['READY', '✅ Ready'],
    ['CANCELED', '🚫 Canceled'],
  ] as [DeploymentState, string][])(
    'returns correct label for %s',
    (state, expected) => {
      expect(statusLabel(state)).toBe(expected);
    }
  );
});

describe('fetchDeployments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns deployments on success', async () => {
    const mockDeployments = [
      { uid: 'dpl_1', name: 'my-app', url: 'my-app.vercel.app', state: 'READY', createdAt: 1700000000000, target: 'production' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ deployments: mockDeployments }),
    } as Response);

    const result = await fetchDeployments(mockConfig);
    expect(result).toEqual(mockDeployments);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.vercel.com/v6/deployments'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token-123' }),
      })
    );
  });

  it('includes teamId in query params when provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ deployments: [] }),
    } as Response);

    await fetchDeployments({ ...mockConfig, teamId: 'team_abc' });
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('teamId=team_abc');
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    await expect(fetchDeployments(mockConfig)).rejects.toThrow(
      'Vercel API error: 401 Unauthorized'
    );
  });
});
