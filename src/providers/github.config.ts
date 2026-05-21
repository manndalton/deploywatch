import { z } from 'zod';

const GitHubEnvSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
  GITHUB_OWNER: z.string().min(1, 'GITHUB_OWNER is required'),
  GITHUB_REPO: z.string().min(1, 'GITHUB_REPO is required'),
  GITHUB_POLL_INTERVAL_MS: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 15_000))
    .pipe(z.number().min(5_000, 'Poll interval must be at least 5000ms')),
});

export interface GitHubProviderConfig {
  token: string;
  owner: string;
  repo: string;
  pollIntervalMs: number;
}

export function loadGitHubConfig(env: NodeJS.ProcessEnv = process.env): GitHubProviderConfig {
  const parsed = GitHubEnvSchema.safeParse(env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid GitHub configuration:\n${issues.join('\n')}`);
  }

  return {
    token: parsed.data.GITHUB_TOKEN,
    owner: parsed.data.GITHUB_OWNER,
    repo: parsed.data.GITHUB_REPO,
    pollIntervalMs: parsed.data.GITHUB_POLL_INTERVAL_MS,
  };
}
