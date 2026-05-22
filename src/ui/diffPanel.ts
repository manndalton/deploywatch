import blessed from "blessed";
import { DeploymentDiff } from "../history/diff";
import { colorizeStatus } from "./layout";
import { pad } from "./formatRow";

const COL_KEY = 30;
const COL_STATUS = 12;
const COL_DELTA = 14;
const COL_BRANCH = 18;

function formatDelta(ms: number | null): string {
  if (ms === null) return pad("-", COL_DELTA);
  const sign = ms >= 0 ? "+" : "-";
  const abs = Math.abs(ms);
  const secs = Math.round(abs / 1000);
  return pad(`${sign}${secs}s`, COL_DELTA);
}

export function formatDiffRow(diff: DeploymentDiff): string {
  const key = pad(diff.key, COL_KEY);
  const status = colorizeStatus(pad(diff.current.status, COL_STATUS));
  const delta = formatDelta(diff.durationDelta);
  const branch = diff.branchChanged
    ? `{yellow-fg}${pad(diff.current.branch, COL_BRANCH)}{/yellow-fg}`
    : pad(diff.current.branch, COL_BRANCH);
  return `${key}${status}${delta}${branch}`;
}

export function renderDiffPanel(
  box: blessed.Widgets.BoxElement,
  diffs: DeploymentDiff[]
): void {
  const header =
    `{bold}` +
    pad("Key", COL_KEY) +
    pad("Status", COL_STATUS) +
    pad("Δ Duration", COL_DELTA) +
    pad("Branch", COL_BRANCH) +
    `{/bold}`;

  const rows = diffs.map(formatDiffRow);
  box.setContent([header, ...rows].join("\n"));
  box.screen.render();
}

export function createDiffPanel(
  screen: blessed.Widgets.Screen,
  opts: Partial<blessed.Widgets.BoxOptions> = {}
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: " Deployment Diffs ",
    border: { type: "line" },
    scrollable: true,
    alwaysScroll: true,
    tags: true,
    style: { border: { fg: "cyan" }, label: { fg: "cyan" } },
    ...opts,
  });
  screen.append(box);
  return box;
}
