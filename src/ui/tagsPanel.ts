/**
 * Renders a compact tag-filter sidebar/panel for the dashboard.
 */

import * as blessed from "blessed";
import { collectTags } from "../history/tags";
import { HistoryEntry } from "../history/history";
import { colorizeStatus } from "./layout";

export interface TagsPanelOptions {
  screen: blessed.Widgets.Screen;
  entries: HistoryEntry[];
  onSelect: (activeTags: string[]) => void;
}

export function createTagsPanel(opts: TagsPanelOptions): {
  box: blessed.Widgets.ListElement;
  refresh: (entries: HistoryEntry[]) => void;
} {
  const activeTags = new Set<string>();

  const box = blessed.list({
    label: " Tags ",
    border: { type: "line" },
    style: {
      border: { fg: "cyan" },
      selected: { bg: "blue", fg: "white" },
      item: { fg: "white" },
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
  });

  function buildItems(entries: HistoryEntry[]): string[] {
    const tags = collectTags(entries);
    return tags.map((t) => {
      const active = activeTags.has(t);
      return active ? `{bold}[x] ${t}{/bold}` : `[ ] ${t}`;
    });
  }

  function refresh(entries: HistoryEntry[]) {
    const items = buildItems(entries);
    (box as any).setItems(items.length ? items : ["(no tags)"]);
    opts.screen.render();
  }

  box.on("select", (_item: any, index: number) => {
    const tags = collectTags(opts.entries);
    if (index >= tags.length) return;
    const tag = tags[index];
    if (activeTags.has(tag)) {
      activeTags.delete(tag);
    } else {
      activeTags.add(tag);
    }
    refresh(opts.entries);
    opts.onSelect(Array.from(activeTags));
  });

  refresh(opts.entries);

  return { box, refresh };
}
