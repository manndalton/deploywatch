import { HistoryEntry } from './history';

export type EscalationLevel = 'warning' | 'critical' | 'page';

export interface EscalationRule {
  id: string;
  name: string;
  level: EscalationLevel;
  failureThreshold: number;  // consecutive failures to trigger
  windowMs: number;          // time window to count failures
  channels: string[];        // e.g. ['slack', 'desktop']
}

export interface EscalationEvent {
  ruleId: string;
  level: EscalationLevel;
  triggeredAt: number;
  entryKey: string;
  failureCount: number;
}

export interface EscalationStore {
  rules: EscalationRule[];
  events: EscalationEvent[];
}

export function emptyEscalationStore(): EscalationStore {
  return { rules: [], events: [] };
}

export function generateEscalationId(): string {
  return `esc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addRule(store: EscalationStore, rule: Omit<EscalationRule, 'id'>): EscalationStore {
  const newRule: EscalationRule = { ...rule, id: generateEscalationId() };
  return { ...store, rules: [...store.rules, newRule] };
}

export function removeRule(store: EscalationStore, ruleId: string): EscalationStore {
  return { ...store, rules: store.rules.filter(r => r.id !== ruleId) };
}

export function evaluateEscalations(
  store: EscalationStore,
  entries: HistoryEntry[],
  entryKey: string,
  now = Date.now()
): { store: EscalationStore; triggered: EscalationEvent[] } {
  const triggered: EscalationEvent[] = [];
  let updatedEvents = [...store.events];

  for (const rule of store.rules) {
    const windowStart = now - rule.windowMs;
    const recentFailures = entries.filter(
      e =>
        `${e.provider}/${e.name}` === entryKey &&
        e.status === 'failure' &&
        new Date(e.timestamp).getTime() >= windowStart
    );

    if (recentFailures.length >= rule.failureThreshold) {
      const alreadyFired = updatedEvents.some(
        ev =>
          ev.ruleId === rule.id &&
          ev.entryKey === entryKey &&
          ev.triggeredAt >= windowStart
      );
      if (!alreadyFired) {
        const event: EscalationEvent = {
          ruleId: rule.id,
          level: rule.level,
          triggeredAt: now,
          entryKey,
          failureCount: recentFailures.length,
        };
        triggered.push(event);
        updatedEvents.push(event);
      }
    }
  }

  return { store: { ...store, events: updatedEvents }, triggered };
}

export function pruneEscalationEvents(store: EscalationStore, maxAgeMs: number, now = Date.now()): EscalationStore {
  const cutoff = now - maxAgeMs;
  return { ...store, events: store.events.filter(e => e.triggeredAt >= cutoff) };
}
