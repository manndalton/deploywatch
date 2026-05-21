export type DeploymentStatus =
  | 'success'
  | 'failure'
  | 'running'
  | 'pending'
  | 'cancelled'
  | 'unknown';

export interface Deployment {
  id: string;
  name: string;
  status: DeploymentStatus;
  url?: string;
  branch?: string;
  commit?: string;
  createdAt: Date;
  updatedAt: Date;
  provider: 'github' | 'vercel';
  meta?: Record<string, string>;
}

export interface DeploymentProvider {
  name: string;
  fetchDeployments(): Promise<Deployment[]>;
}

export interface ProviderConfig {
  pollIntervalMs: number;
  maxItems: number;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  pollIntervalMs: 30_000,
  maxItems: 10,
};
