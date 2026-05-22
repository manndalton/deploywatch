import * as blessed from 'blessed';
import {
  Annotation,
  AnnotationMap,
  addAnnotation,
  getAnnotations,
} from '../history/annotations';
import { colorizeStatus } from './layout';

const DATE_WIDTH = 20;
const AUTHOR_WIDTH = 12;

function formatAnnotationRow(a: Annotation): string {
  const date = a.createdAt.slice(0, 19).replace('T', ' ');
  const author = (a.author ?? 'unknown').padEnd(AUTHOR_WIDTH).slice(0, AUTHOR_WIDTH);
  return `{gray-fg}${date}{/} {cyan-fg}${author}{/} ${a.note}`;
}

export function renderAnnotationsPanel(
  box: blessed.Widgets.BoxElement,
  entryId: string,
  map: AnnotationMap
): void {
  const annotations = getAnnotations(map, entryId);
  if (annotations.length === 0) {
    box.setContent('{gray-fg}No annotations for this entry.{/}');
  } else {
    const lines = annotations.map(formatAnnotationRow);
    box.setContent(lines.join('\n'));
  }
  box.screen.render();
}

export interface AnnotationsPanelOptions {
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement;
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
}

export function createAnnotationsPanel(
  opts: AnnotationsPanelOptions
): blessed.Widgets.BoxElement {
  return blessed.box({
    parent: opts.parent as blessed.Widgets.Screen,
    top: opts.top,
    left: opts.left,
    width: opts.width,
    height: opts.height,
    border: { type: 'line' },
    label: ' Annotations ',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white', bold: true },
    },
  });
}
