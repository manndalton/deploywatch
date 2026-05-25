import blessed from 'blessed';
import {
  FeedbackEntry,
  FeedbackStore,
  FeedbackRating,
  summariseFeedback,
  getFeedbackForEntry,
} from '../history/feedback';
import { colorizeStatus } from './layout';
import { pad } from './formatRow';

const RATING_ICON: Record<FeedbackRating, string> = {
  positive: '{green-fg}▲{/green-fg}',
  negative: '{red-fg}▼{/red-fg}',
  neutral: '{yellow-fg}●{/yellow-fg}',
};

export function formatFeedbackRow(f: FeedbackEntry): string {
  const icon = RATING_ICON[f.rating];
  const ts = new Date(f.createdAt).toISOString().slice(0, 16);
  const author = pad(f.author, 12);
  const note = f.note.length > 40 ? f.note.slice(0, 37) + '...' : pad(f.note, 40);
  return `${icon} ${author} ${ts}  ${note}`;
}

export function renderFeedbackPanel(
  box: blessed.Widgets.BoxElement,
  store: FeedbackStore,
  entryId: string,
): void {
  const items = getFeedbackForEntry(store, entryId);
  const summary = summariseFeedback(store, entryId);

  const header =
    `{bold}Feedback for entry: ${entryId}{/bold}  ` +
    `{green-fg}▲ ${summary.positive}{/green-fg}  ` +
    `{red-fg}▼ ${summary.negative}{/red-fg}  ` +
    `{yellow-fg}● ${summary.neutral}{/yellow-fg}`;

  const rows = items.length
    ? items.map(formatFeedbackRow).join('\n')
    : '{grey-fg}No feedback yet.{/grey-fg}';

  box.setContent(`${header}\n\n${rows}`);
  box.screen.render();
}

export function createFeedbackPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  store: FeedbackStore,
  entryId: string,
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    parent,
    top: 'center',
    left: 'center',
    width: '70%',
    height: '60%',
    border: { type: 'line' },
    label: ' Feedback ',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    style: { border: { fg: 'cyan' } },
  });

  renderFeedbackPanel(box, store, entryId);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: FeedbackStore,
  entryId: string,
): void {
  renderFeedbackPanel(box, store, entryId);
}
