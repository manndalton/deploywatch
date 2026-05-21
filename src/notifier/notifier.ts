import { DeploymentStatus } from '../providers/types';

export type NotificationLevel = 'info' | 'warning' | 'error';

export interface StatusChange {
  id: string;
  name: string;
  provider: string;
  previous: DeploymentStatus;
  current: DeploymentStatus;
  timestamp: Date;
}

export interface Notifier {
  notify(change: StatusChange): void;
}

const FAILURE_STATES: DeploymentStatus[] = ['failure', 'error', 'cancelled'];
const SUCCESS_STATES: DeploymentStatus[] = ['success'];

export function classifyChange(change: StatusChange): NotificationLevel {
  if (FAILURE_STATES.includes(change.current)) return 'error';
  if (SUCCESS_STATES.includes(change.current)) return 'info';
  return 'warning';
}

export function formatNotification(change: StatusChange): string {
  const level = classifyChange(change);
  const icon = level === 'error' ? '✗' : level === 'info' ? '✓' : '⚠';
  return `${icon} [${change.provider.toUpperCase()}] ${change.name}: ${change.previous} → ${change.current}`;
}

export class ConsoleNotifier implements Notifier {
  private seen = new Map<string, DeploymentStatus>();

  notify(change: StatusChange): void {
    const message = formatNotification(change);
    const level = classifyChange(change);
    if (level === 'error') {
      process.stderr.write(message + '\n');
    } else {
      process.stdout.write(message + '\n');
    }
  }

  detectChanges(
    id: string,
    name: string,
    provider: string,
    current: DeploymentStatus
  ): StatusChange | null {
    const previous = this.seen.get(id);
    this.seen.set(id, current);
    if (previous === undefined || previous === current) return null;
    return { id, name, provider, previous, current, timestamp: new Date() };
  }
}
