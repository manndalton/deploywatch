import * as fs from 'fs';
import * as path from 'path';

export interface VercelConfig {
  token: string;
  teamId?: string;
  projectIds?: string[];
}

export function loadVercelConfig(): VercelConfig {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error(
      'VERCEL_TOKEN environment variable is required. ' +
        'Generate one at https://vercel.com/account/tokens'
    );
  }

  const teamId = process.env.VERCEL_TEAM_ID || undefined;

  const projectIds = process.env.VERCEL_PROJECT_IDS
    ? process.env.VERCEL_PROJECT_IDS.split(',').map((id) => id.trim())
    : undefined;

  const configFilePath = path.resolve(process.cwd(), '.deploywatch.json');
  if (fs.existsSync(configFilePath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      return {
        token,
        teamId: teamId ?? fileConfig.vercel?.teamId,
        projectIds: projectIds ?? fileConfig.vercel?.projectIds,
      };
    } catch {
      // fall through to env-only config
    }
  }

  return { token, teamId, projectIds };
}
