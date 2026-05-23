import * as blessed from "blessed";
import {
  DependencyStore,
  getDependencies,
  getDependents,
} from "../history/dependencies";
import { pad } from "./formatRow";
import { totalWidth, colorizeStatus } from "./layout";

const COL_KEY = 36;
const COL_LABEL = 16;

export function formatDependencyRow(
  role: "depends-on" | "dependent",
  key: string,
  label?: string
): string {
  const roleStr = role === "depends-on" ? "→ needs" : "← needed by";
  return pad(roleStr, 14) + " " + pad(key, COL_KEY) + " " + pad(label ?? "", COL_LABEL);
}

/**
 * Renders the dependencies panel content for a given resource key.
 * Returns an array of lines including a header, separator, and one row
 * per dependency or dependent. If no relationships exist, returns a
 * single informational message line.
 */
export function renderDependenciesPanel(
  store: DependencyStore,
  focusKey: string
): string[] {
  const lines: string[] = [];
  const header =
    pad("role", 14) + " " + pad("key", COL_KEY) + " " + pad("label", COL_LABEL);
  lines.push(header);
  lines.push("-".repeat(totalWidth));

  const deps = getDependencies(store, focusKey);
  const dependents = getDependents(store, focusKey);

  if (deps.length === 0 && dependents.length === 0) {
    lines.push("  (no dependencies)");
    return lines;
  }

  for (const d of deps) {
    lines.push(formatDependencyRow("depends-on", d.dependsOnKey, d.label));
  }
  for (const d of dependents) {
    lines.push(formatDependencyRow("dependent", d.dependentKey, d.label));
  }

  return lines;
}

export function createDependenciesPanel(
  screen: blessed.Widgets.Screen,
  store: DependencyStore,
  focusKey: string
): blessed.Widgets.BoxElement {
  const content = renderDependenciesPanel(store, focusKey).join("\n");
  const box = blessed.box({
    label: " Dependencies ",
    top: "60%",
    left: "0",
    width: "100%",
    height: "40%",
    border: { type: "line" },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    content,
  });
  screen.append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: DependencyStore,
  focusKey: string
): void {
  box.setContent(renderDependenciesPanel(store, focusKey).join("\n"));
}
