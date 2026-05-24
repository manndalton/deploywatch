import { formatEscalationRow, renderEscalationPanel } from './escalationPanel';
import { EscalationEvent, EscalationRule, emptyEscalationStore, addRule } from '../history/escalation';

const NOW = 1_700_000_000_000;

function makeRule(overrides: Partial<EscalationRule> = {}): EscalationRule {
  return {
    id: 'rule_1',
    name: 'Test Rule',
    level: 'critical',
    failureThreshold: 3,
    windowMs: 60_000,
    channels: ['slack'],
    ...overrides,
  };
}

function makeEvent(overrides: Partial<EscalationEvent> = {}): EscalationEvent {
  return {
    ruleId: 'rule_1',
    level: 'critical',
    triggeredAt: NOW,
    entryKey: 'github/deploy',
    failureCount: 4,
    ...overrides,
  };
}

function makeBox(): any {
  let content = '';
  return {
    setContent: (c: string) => { content = c; },
    getContent: () => content,
    screen: { render: jest.fn() },
  };
}

test('formatEscalationRow includes level, key, and count', () => {
  const row = formatEscalationRow(makeEvent(), [makeRule()]);
  expect(row).toContain('CRITICAL');
  expect(row).toContain('github/deploy');
  expect(row).toContain('x4');
  expect(row).toContain('Test Rule');
});

test('formatEscalationRow uses rule id when rule not found', () => {
  const row = formatEscalationRow(makeEvent({ ruleId: 'unknown' }), [makeRule()]);
  expect(row).toContain('unknown');
});

test('formatEscalationRow applies warning level label', () => {
  const row = formatEscalationRow(makeEvent({ level: 'warning' }), [makeRule({ level: 'warning' })]);
  expect(row).toContain('WARNING');
});

test('renderEscalationPanel sets content with header and rows', () => {
  const box = makeBox();
  let store = addRule(emptyEscalationStore(), {
    name: 'Test Rule',
    level: 'page',
    failureThreshold: 2,
    windowMs: 30_000,
    channels: [],
  });
  store = { ...store, events: [makeEvent({ level: 'page', ruleId: store.rules[0].id })] };
  renderEscalationPanel(box as any, store);
  const content = box.getContent();
  expect(content).toContain('TIME');
  expect(content).toContain('LEVEL');
  expect(content).toContain('PAGE');
});

test('renderEscalationPanel handles empty events', () => {
  const box = makeBox();
  renderEscalationPanel(box as any, emptyEscalationStore());
  const content = box.getContent();
  expect(content).toContain('TIME');
});
