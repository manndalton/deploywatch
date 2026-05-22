import * as blessed from "blessed";
import {
  LabelStore,
  getLabels,
  addLabel,
  removeLabel,
  allLabels,
} from "../history/labels";
import { pad } from "./formatRow";
import { totalWidth, colorizeStatus } from "./layout";

const COL_ID = 20;
const COL_LABELS = 50;

export function formatLabelRow(entryId: string, labels: string[]): string {
  const idCol = pad(entryId, COL_ID);
  const labelsCol = pad(labels.length > 0 ? labels.join(", ") : "(none)", COL_LABELS);
  return `${idCol}  ${labelsCol}`;
}

export function renderLabelsPanel(
  box: blessed.Widgets.BoxElement,
  store: LabelStore,
  selectedId: string | null
): void {
  const header =
    `{bold}${pad("Entry ID", COL_ID)}  ${pad("Labels", COL_LABELS)}{/bold}`;

  const ids = Object.keys(store.entries);
  if (ids.length === 0 && !selectedId) {
    box.setContent(`${header}\n\n  {gray-fg}No labelled entries.{/gray-fg}`);
    box.screen.render();
    return;
  }

  const rows = ids.map((id) => {
    const labels = getLabels(store, id);
    const row = formatLabelRow(id, labels);
    return id === selectedId ? `{cyan-fg}${row}{/cyan-fg}` : row;
  });

  box.setContent([header, ...rows].join("\n"));
  box.screen.render();
}

export function createLabelsPanel(
  parent: blessed.Widgets.Screen,
  initialStore: LabelStore
): {
  box: blessed.Widgets.BoxElement;
  refresh: (store: LabelStore, selectedId: string | null) => void;
  addLabel: (store: LabelStore, id: string, label: string) => LabelStore;
  removeLabel: (store: LabelStore, id: string, label: string) => LabelStore;
  allLabels: (store: LabelStore) => string[];
} {
  const box = blessed.box({
    top: 0,
    left: 0,
    width: totalWidth,
    height: "100%",
    border: { type: "line" },
    label: " Labels ",
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
  });

  parent.append(box);
  renderLabelsPanel(box, initialStore, null);

  return {
    box,
    refresh: (store, selectedId) => renderLabelsPanel(box, store, selectedId),
    addLabel,
    removeLabel,
    allLabels,
  };
}
