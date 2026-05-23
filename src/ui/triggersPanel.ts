import * as blessed from 'blessed';
import { TriggerStore, Trigger, TriggerType, getTriggersForEntry, groupByType } from '../history/triggers';
import { pad } from './formatRow';
import { colorizeStatus } from './layout';

const TYPE_COLORS: Record<TriggerType, string> = {
  manual: '{yellow-fg}',
  push: '{green-fg}',
  pr: '{cyan-fg}',
  schedule: '{blue-fg}',
  api: '{magenta-fg}',
  webhook: '{white-fg}',
};

export function colorType(type: TriggerType): string {
  const color = TYPE_COLORS[type] ?? '{white-fg}';
  return `${color}${type}{/}`;
}

export function formatTriggerRow(trigger: Trigger): string {
  const time = new Date(trigger.createdAt).toISOString().slice(11, 19);
  const actor = pad(trigger.actor ?? '—', 12);
  const ref = pad(trigger.ref ?? '—', 24);
  const type = pad(colorType(trigger.type), 22);
  return `${type} ${actor} ${ref} ${time}`;
}

export function renderTriggersPanel(store: TriggerStore, entryId?: string): string[] {
  const triggers = entryId
    ? getTriggersForEntry(store, entryId)
    : store.triggers;
  if (triggers.length === 0) return ['{gray-fg}No triggers found.{/}'];
  return triggers
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(formatTriggerRow);
}

export function createTriggersPanel(
  screen: blessed.Widgets.Screen,
  store: TriggerStore,
  entryId?: string
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Triggers ',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white' } },
  });

  function refresh(s: TriggerStore, id?: string) {
    const lines = renderTriggersPanel(s, id);
    box.setContent(lines.join('\n'));
    screen.render();
  }

  refresh(store, entryId);
  (box as any).refresh = refresh;
  screen.append(box);
  return box;
}
