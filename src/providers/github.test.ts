import { describe, it, expect, vi, beforeEach } from 'vitest';
import fetch from 'node-fetch';
import { fetchWorkflowRuns, statusLabel, WorkflowRun } from './github';

vi.mock('node-fetch');

const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;

const mockRun = (overrides: Partial<WorkflowRun> = {}): WorkflowRun => ({
  id: 1,
  name: 'CI',
  status: 'completed',
  conclusion: 'success',
  html_url: 'https://github.com/owner/repo/actions/runs/1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:05:00Z',
  head_branch: 'main',
  head_sha: 'abc123',
  ...overrides,
});

describe('fetchWorkflowRuns', () => {
  const config = { token: 'tok', owner: 'owner', repo: 'repo' };

  beforeEach(() => vi.clearAllMocks());

  it('returns workflow runs on success', async () => {
    const runs = [mockRun(), mockRun({ id: 2, conclusion: 'failure' })];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ workflow_runs: runs }),
    });

    const result = await fetchWorkflowRuns(config);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(fetchWorkflowRuns(config)).rejects.toThrow('GitHub API error: 401');
  });
});

describe('statusLabel', () => {
  it('returns conclusion when completed', () => {
    expect(statusLabel(mockRun({ conclusion: 'success' }))).toBe('success');
    expect(statusLabel(mockRun({ conclusion: 'failure' }))).toBe('failure');
  });

  it('returns formatted status when not completed', () => {
    expect(statusLabel(mockRun({ status: 'in_progress', conclusion: null }))).toBe('in progress');
    expect(statusLabel(mockRun({ status: 'queued', conclusion: null }))).toBe('queued');
  });
});
