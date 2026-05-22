import * as blessed from "blessed";
import {
  Bookmark,
  BookmarkStore,
  listBookmarks,
  removeBookmark,
} from "../history/bookmarks";
import { pad } from "./formatRow";
import { colorizeStatus } from "./layout";

const COL_LABEL = 24;
const COL_REPO = 22;
const COL_NOTE = 26;

export function formatBookmarkRow(bookmark: Bookmark): string {
  const [, repo] = bookmark.entryKey.split(":");
  const date = bookmark.createdAt.slice(0, 10);
  const note = bookmark.note ?? "";
  return (
    pad(bookmark.label, COL_LABEL) +
    pad(repo ?? "", COL_REPO) +
    pad(date, 12) +
    pad(note, COL_NOTE)
  );
}

export function renderBookmarksPanel(
  box: blessed.Widgets.BoxElement,
  store: BookmarkStore
): void {
  const bookmarks = listBookmarks(store);
  if (bookmarks.length === 0) {
    box.setContent("{center}No bookmarks yet.{/center}");
    box.screen.render();
    return;
  }

  const header =
    "{bold}" +
    pad("Label", COL_LABEL) +
    pad("Repo", COL_REPO) +
    pad("Date", 12) +
    pad("Note", COL_NOTE) +
    "{/bold}";

  const rows = bookmarks.map((b) => formatBookmarkRow(b));
  box.setContent([header, ...rows].join("\n"));
  box.screen.render();
}

export function createBookmarksPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  store: { current: BookmarkStore },
  onRemove: (updated: BookmarkStore) => void
): blessed.Widgets.ListElement {
  const list = blessed.list({
    parent,
    top: "10%",
    left: "center",
    width: "90%",
    height: "80%",
    border: { type: "line" },
    label: " Bookmarks ",
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      selected: { bg: "blue", fg: "white" },
      border: { fg: "cyan" },
    },
  });

  function refresh() {
    const bookmarks = listBookmarks(store.current);
    list.setItems(bookmarks.map((b) => formatBookmarkRow(b)) as any);
    (list.screen as blessed.Widgets.Screen).render();
  }

  list.key(["d", "delete"], () => {
    const idx = (list as any).selected as number;
    const bookmarks = listBookmarks(store.current);
    if (bookmarks[idx]) {
      store.current = removeBookmark(store.current, bookmarks[idx].id);
      onRemove(store.current);
      refresh();
    }
  });

  refresh();
  return list;
}
