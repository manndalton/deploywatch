import { colorType, formatTriggerRow, renderTriggersPanel } from './triggersPanel';
import {
  emptyTriggerStore,
  createTrigger,
  addTrigger,
  Trigger,
  TriggerStore,
} from '../history/triggers';

function makeEntry(entryId: string, overrides: Partial<Trigger> = {}): Trigger {
  return {
    ...createTrigger(entryId, 'push', { actor: 'alice', ref: 'refs/heads/main' }),
    ...overrides,
  };
}

describe('triggersPanel', () => {
  describe('colorType', () => {
    it('wraps push in green tags', () => {
      expect(colorType('push')).toContain('{green-fg}');
      expect(colorType('push')).toContain('push');
    });

    it('wraps manual in yellow tags', () => {
      expect(colorType('manual')).toContain('{yellow-fg}');
    });
  });

  describe('formatTriggerRow', () => {
    it('includes actor, ref, and type', () => {
      const t = makeEntry('e1', { actor: 'bob', ref: 'refs/heads/feat', createdAt: new Date('2024-01-15T12:34:56Z').getTime() });
      const row = formatTriggerRow(t);
      expect(row).toContain('bob');
      expect(row).toContain('refs/heads/feat');
      expect(row).toContain('12:34:56');
    });

    it('uses dash for missing actor', () => {
      const t = makeEntry('e1', { actor: undefined });
      expect(formatTriggerRow(t)).toContain('—');
    });
  });

  describe('renderTriggersPanel', () => {
    it('returns empty message when no triggers', () => {
      const store = emptyTriggerStore();
      const lines = renderTriggersPanel(store);
      expect(lines[0]).toContain('No triggers found');
    });

    it('renders all triggers when no entryId given', () => {
      let store = emptyTriggerStore();
      store = addTrigger(store, makeEntry('e1'));
      store = addTrigger(store, makeEntry('e2'));
      const lines = renderTriggersPanel(store);
      expect(lines).toHaveLength(2);
    });

    it('filters by entryId', () => {
      let store = emptyTriggerStore();
      store = addTrigger(store, makeEntry('e1'));
      store = addTrigger(store, makeEntry('e2'));
      store = addTrigger(store, makeEntry('e1'));
      const lines = renderTriggersPanel(store, 'e1');
      expect(lines).toHaveLength(2);
    });

    it('sorts newest first', () => {
      const now = Date.now();
      let store = emptyTriggerStore();
      store = addTrigger(store, makeEntry('e1', { createdAt: now - 1000, actor: 'older' }));
      store = addTrigger(store, makeEntry('e2', { createdAt: now, actor: 'newer' }));
      const lines = renderTriggersPanel(store);
      expect(lines[0]).toContain('newer');
    });
  });
});
