import * as blessed from "blessed";
import { HistoryEntry } from "../history/history";
import { searchEntries, SearchOptions } from "../history/search";
import { colorizeStatus } from "./layout";
import { pad } from "./formatRow";

const COL_WIDTHS = [10, 24, 14, 10, 26];

function formatSearchRow(entry: HistoryEntry): string {
  const ts = new Date(entry.timestamp).toLocaleString();
  return [
    pad(entry.provider, COL_WIDTHS[0]),
    pad(entry.repo, COL_WIDTHS[1]),
    pad(entry.branch ?? "-", COL_WIDTHS[2]),
    colorizeStatus(pad(entry.status, COL_WIDTHS[3])),
    pad(ts, COL_WIDTHS[4]),
  ].join(" ");
}

export function renderSearchPanel(
  box: blessed.Widgets.BoxElement,
  entries: HistoryEntry[],
  opts: SearchOptions
): void {
  const matches = searchEntries(entries, opts);

  const header =
    "{bold}" +
    [
      pad("PROVIDER", COL_WIDTHS[0]),
      pad("REPO", COL_WIDTHS[1]),
      pad("BRANCH", COL_WIDTHS[2]),
      pad("STATUS", COL_WIDTHS[3]),
      pad("TIMESTAMP", COL_WIDTHS[4]),
    ].join(" ") +
    "{/bold}";

  const rows = matches.map(formatSearchRow);

  const summary = `{gray-fg}${matches.length} result${matches.length !== 1 ? "s" : ""}{/gray-fg}`;

  box.setContent([header, ...rows, "", summary].join("\n"));
  box.screen.render();
}

export function createSearchBox(
  screen: blessed.Widgets.Screen
): blessed.Widgets.BoxElement {
  return blessed.box({
    top: "center",
    left: "center",
    width: "90%",
    height: "80%",
    label: " Search History ",
    border: { type: "line" },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    tags: true,
    style: {
      border: { fg: "cyan" },
      label: { fg: "white" },
    },
    screen,
  });
}
