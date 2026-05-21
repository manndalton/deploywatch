import { VercelConfig } from './vercel.config';

export type DeploymentState =
  | 'BUILDING'
  | 'ERROR'
  | 'INITIALIZING'
  | 'QUEUED'
  | 'READY'
  | 'CANCELED';

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: DeploymentState;
  createdAt: number;
  target: 'production' | 'preview' | null;
}

export function statusLabel(state: DeploymentState): string {
  switch (state) {
    case 'BUILDING':
      return '🔨 Building';
    case 'ERROR':
      return '❌ Error';
    case 'INITIALIZING':
      return '⏳ Initializing';
    case 'QUEUED':
      return '🕐 Queued';
    case 'READY':
      return '✅ Ready';
    case 'CANCELED':
      return '🚫 Canceled';
    default:
      return '❓ Unknown';
  }
}

export async function fetchDeployments(
  config: VercelConfig
): Promise<VercelDeployment[]> {
  const params = new URLSearchParams({ limit: '20' });
  if (config.teamId) params.set('teamId', config.teamId);

  const res = await fetch(
    `https://api.vercel.com/v6/deployments?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Vercel API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.deployments as VercelDeployment[];
}
