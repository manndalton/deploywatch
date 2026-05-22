import * as blessed from 'blessed';
import { Comment, CommentsStore, getComments, addComment, removeComment } from '../history/comments';
import { pad } from './formatRow';
import { colorizeStatus } from './layout';

const COL_AUTHOR = 12;
const COL_DATE = 22;

export function formatCommentRow(comment: Comment, width: number): string {
  const author = pad(comment.author, COL_AUTHOR);
  const date = pad(comment.createdAt.slice(0, 19).replace('T', ' '), COL_DATE);
  const edited = comment.updatedAt ? '{yellow-fg}*{/}' : ' ';
  const bodyWidth = Math.max(width - COL_AUTHOR - COL_DATE - 3, 8);
  const body = pad(comment.body, bodyWidth);
  return `{cyan-fg}${author}{/} ${date} ${edited}${body}`;
}

export function renderCommentsPanel(
  box: blessed.Widgets.BoxElement,
  store: CommentsStore,
  entryKey: string
): void {
  const comments = getComments(store, entryKey);
  if (comments.length === 0) {
    box.setContent('{grey-fg}No comments for this entry.{/}');
    box.screen.render();
    return;
  }
  const width = (box.width as number) - 2;
  const header =
    `{bold}${pad('Author', COL_AUTHOR)} ${pad('Date', COL_DATE)}  Body{/}` +
    '\n' +
    '─'.repeat(width);
  const rows = comments.map((c) => formatCommentRow(c, width));
  box.setContent([header, ...rows].join('\n'));
  box.screen.render();
}

export function createCommentsPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  options: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' 💬 Comments ',
    border: { type: 'line' },
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
    ...options,
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  return box;
}
