import { EventEmitter } from 'events';
import type { Deployment, DeploymentProvider } from '../providers/types';

export interface PollResult {
  provider: string;
  deployments: Deployment[];
  fetchedAt: Date;
  error?: Error;
}

export class Poller extends EventEmitter {
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private providers: DeploymentProvider[] = [];

  constructor(private readonly intervalMs: number = 30_000) {
    super();
  }

  register(provider: DeploymentProvider): this {
    this.providers.push(provider);
    return this;
  }

  async pollOnce(provider: DeploymentProvider): Promise<PollResult> {
    const fetchedAt = new Date();
    try {
      const deployments = await provider.fetchDeployments();
      const result: PollResult = { provider: provider.name, deployments, fetchedAt };
      this.emit('update', result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const result: PollResult = { provider: provider.name, deployments: [], fetchedAt, error };
      this.emit('error', result);
      return result;
    }
  }

  start(): void {
    for (const provider of this.providers) {
      void this.pollOnce(provider);
      const timer = setInterval(() => void this.pollOnce(provider), this.intervalMs);
      this.timers.set(provider.name, timer);
    }
    this.emit('started');
  }

  stop(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.emit('stopped');
  }

  /**
   * Polls all registered providers once and returns their results.
   * Useful for performing a manual refresh outside the normal interval cycle.
   */
  async pollAll(): Promise<PollResult[]> {
    return Promise.all(this.providers.map((provider) => this.pollOnce(provider)));
  }

  get isRunning(): boolean {
    return this.timers.size > 0;
  }
}
