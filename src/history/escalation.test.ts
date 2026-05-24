import {
  emptyEscalationStore,
  addRule,
  removeRule,
  evaluateEscalations,
  pruneEscalationEvents,
  EscalationRule,
} from './escalation';
import { HistoryEntry } from './history';

const NOW = 1_700_000_000_000;

function makeEntry(status: 'success' | 'failure', offsetMs = 0): HistoryEntry {
  return {
    provider: 'github',
    name: 'deploy',
    status,
    timestamp: new Date(NOW - offsetMs).toISOString(),
    duration: 30,
    branch: 'main',
    commit: 'abc123',
  };
}

const baseRule: Omit<EscalationRule, 'id'> = {
  name: 'High failure rate',
  level: 'critical',
  failureThreshold: 3,
  windowMs: 60_000,
  channels: ['slack'],
};

test('addRule assigns an id and appends to store', () => {
  const store = addRule(emptyEscalationStore(), baseRule);
  expect(store.rules).toHaveLength(1);
  expect(store.rules[0].id).toMatch(/^esc_/);
  expect(store.rules[0].name).toBe('High failure rate');
});

test('removeRule deletes by id', () => {
  let store = addRule(emptyEscalationStore(), baseRule);
  const id = store.rules[0].id;
  store = removeRule(store, id);
  expect(store.rules).toHaveLength(0);
});

test('evaluateEscalations triggers when threshold met', () => {
  const store = addRule(emptyEscalationStore(), baseRule);
  const entries = [makeEntry('failure', 1000), makeEntry('failure', 2000), makeEntry('failure', 3000)];
  const { triggered } = evaluateEscalations(store, entries, 'github/deploy', NOW);
  expect(triggered).toHaveLength(1);
  expect(triggered[0].level).toBe('critical');
  expect(triggered[0].failureCount).toBe(3);
});

test('evaluateEscalations does not trigger when below threshold', () => {
  const store = addRule(emptyEscalationStore(), baseRule);
  const entries = [makeEntry('failure', 1000), makeEntry('failure', 2000)];
  const { triggered } = evaluateEscalations(store, entries, 'github/deploy', NOW);
  expect(triggered).toHaveLength(0);
});

test('evaluateEscalations does not fire twice in same window', () => {
  let store = addRule(emptyEscalationStore(), baseRule);
  const entries = [makeEntry('failure', 1000), makeEntry('failure', 2000), makeEntry('failure', 3000)];
  const first = evaluateEscalations(store, entries, 'github/deploy', NOW);
  store = first.store;
  const second = evaluateEscalations(store, entries, 'github/deploy', NOW);
  expect(second.triggered).toHaveLength(0);
});

test('pruneEscalationEvents removes old events', () => {
  let store = addRule(emptyEscalationStore(), baseRule);
  const entries = [makeEntry('failure', 1000), makeEntry('failure', 2000), makeEntry('failure', 3000)];
  const result = evaluateEscalations(store, entries, 'github/deploy', NOW);
  store = result.store;
  store = pruneEscalationEvents(store, 1000, NOW + 2000);
  expect(store.events).toHaveLength(0);
});
