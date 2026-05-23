import { HistoryEntry } from './history';

export interface ScheduledCheck {
  id: string;
  label: string;
  cronExpression: string;
  lastRun?: number;
  nextRun: number;
  enabled: boolean;
  tags?: string[];
}

export interface ScheduleStore {
  checks: ScheduledCheck[];
}

export function emptyScheduleStore(): ScheduleStore {
  return { checks: [] };
}

export function generateScheduleId(): string {
  return `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function parseCronNext(cron: string, from: number = Date.now()): number {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron expression: ${cron}`);
  const intervalMinutes = parts[1] === '*' ? 1 : parseInt(parts[1], 10) || 1;
  return from + intervalMinutes * 60 * 1000;
}

export function addSchedule(
  store: ScheduleStore,
  label: string,
  cronExpression: string,
  tags: string[] = []
): ScheduleStore {
  const check: ScheduledCheck = {
    id: generateScheduleId(),
    label,
    cronExpression,
    nextRun: parseCronNext(cronExpression),
    enabled: true,
    tags,
  };
  return { checks: [...store.checks, check] };
}

export function removeSchedule(store: ScheduleStore, id: string): ScheduleStore {
  return { checks: store.checks.filter((c) => c.id !== id) };
}

export function toggleSchedule(store: ScheduleStore, id: string): ScheduleStore {
  return {
    checks: store.checks.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ),
  };
}

export function markRan(store: ScheduleStore, id: string, at: number = Date.now()): ScheduleStore {
  return {
    checks: store.checks.map((c) =>
      c.id === id
        ? { ...c, lastRun: at, nextRun: parseCronNext(c.cronExpression, at) }
        : c
    ),
  };
}

export function getDueChecks(store: ScheduleStore, now: number = Date.now()): ScheduledCheck[] {
  return store.checks.filter((c) => c.enabled && c.nextRun <= now);
}

export function getSchedules(store: ScheduleStore): ScheduledCheck[] {
  return [...store.checks];
}
