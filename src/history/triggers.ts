import { HistoryEntry } from './history';

export type TriggerType = 'manual' | 'push' | 'pr' | 'schedule' | 'api' | 'webhook';

export interface Trigger {
  id: string;
  entryId: string;
  type: TriggerType;
  actor?: string;
  ref?: string;
  message?: string;
  createdAt: number;
}

export interface TriggerStore {
  triggers: Trigger[];
}

export function emptyTriggerStore(): TriggerStore {
  return { triggers: [] };
}

export function generateTriggerId(): string {
  return `trg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTrigger(
  entryId: string,
  type: TriggerType,
  opts: Partial<Omit<Trigger, 'id' | 'entryId' | 'type' | 'createdAt'>> = {}
): Trigger {
  return {
    id: generateTriggerId(),
    entryId,
    type,
    createdAt: Date.now(),
    ...opts,
  };
}

export function addTrigger(store: TriggerStore, trigger: Trigger): TriggerStore {
  return { triggers: [...store.triggers, trigger] };
}

export function removeTrigger(store: TriggerStore, triggerId: string): TriggerStore {
  return { triggers: store.triggers.filter((t) => t.id !== triggerId) };
}

export function getTriggersForEntry(store: TriggerStore, entryId: string): Trigger[] {
  return store.triggers.filter((t) => t.entryId === entryId);
}

export function groupByType(store: TriggerStore): Record<TriggerType, Trigger[]> {
  const result: Record<TriggerType, Trigger[]> = {
    manual: [], push: [], pr: [], schedule: [], api: [], webhook: [],
  };
  for (const t of store.triggers) {
    result[t.type].push(t);
  }
  return result;
}

export function pruneTriggers(store: TriggerStore, beforeMs: number): TriggerStore {
  return { triggers: store.triggers.filter((t) => t.createdAt >= beforeMs) };
}
