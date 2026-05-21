import fetch from 'node-fetch';

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  head_branch: string;
  head_sha: string;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export async function fetchWorkflowRuns(
  config: GitHubConfig,
  limit = 10
): Promise<WorkflowRun[]> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/runs?per_page=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as { workflow_runs: WorkflowRun[] };
  return data.workflow_runs;
}

export function statusLabel(run: WorkflowRun): string {
  if (run.status !== 'completed') return run.status.replace('_', ' ');
  return run.conclusion ?? 'unknown';
}
