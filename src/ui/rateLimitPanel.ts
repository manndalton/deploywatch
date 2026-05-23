import * as blessed from "blessed";
import {
  RateLimitStore,
  RateLimitEntry,
  isRateLimited,
  usagePercent,
} from "../history/ratelimit";
import { colorizeStatus } from "./layout";
import { pad } from "./formatRow";

const COL_PROVIDER = 12;
const COL_REMAINING = 10;
const COL_LIMIT = 8;
const COL_USAGE = 8;
const COL_RESET = 20;

export function formatRateLimitRow(entry: RateLimitEntry, now: number = Date.now()): string {
  const limited = isRateLimited({ entries: { [entry.provider]: entry } }, entry.provider, now);
  const status = limited ? "throttled" : "ok";
  const resetIn = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
  const resetStr = resetIn > 0 ? `in ${resetIn}s` : "now";

  return [
    colorizeStatus(pad(entry.provider, COL_PROVIDER), status as never),
    pad(String(entry.remaining), COL_REMAINING),
    pad(String(entry.limit), COL_LIMIT),
    pad(`${usagePercent(entry)}%`, COL_USAGE),
    pad(resetStr, COL_RESET),
  ].join(" ");
}

export function renderRateLimitPanel(
  box: blessed.Widgets.BoxElement,
  store: RateLimitStore,
  now: number = Date.now()
): void {
  const header = [
    pad("PROVIDER", COL_PROVIDER),
    pad("REMAINING", COL_REMAINING),
    pad("LIMIT", COL_LIMIT),
    pad("USAGE", COL_USAGE),
    pad("RESET", COL_RESET),
  ].join(" ");

  const entries = Object.values(store.entries);
  if (entries.length === 0) {
    box.setContent(`{bold}${header}{/bold}\n\nNo rate limit data available.`);
    return;
  }

  const rows = entries
    .sort((a, b) => a.provider.localeCompare(b.provider))
    .map((e) => formatRateLimitRow(e, now))
    .join("\n");

  box.setContent(`{bold}${header}{/bold}\n${rows}`);
}

export function createRateLimitPanel(
  screen: blessed.Widgets.Screen,
  options: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: " Rate Limits ",
    border: { type: "line" },
    tags: true,
    scrollable: true,
    keys: true,
    vi: true,
    ...options,
  });
  screen.append(box);
  return box;
}
