import * as blessed from 'blessed';
import { Cluster, ClusterStore } from '../history/clustering';

const BAR_CHARS = ' ▏▎▍▌▋▊▉█';

function durationLabel(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function miniBar(value: number, max: number, width = 10): string {
  if (max === 0) return ' '.repeat(width);
  const ratio = Math.min(value / max, 1);
  const filled = Math.round(ratio * width);
  return BAR_CHARS[8].repeat(filled).padEnd(width);
}

export function formatClusterRow(cluster: Cluster, maxCentroid: number): string {
  const bar = miniBar(cluster.centroid, maxCentroid, 12);
  const label = cluster.label.padEnd(10);
  const count = String(cluster.entries.length).padStart(4);
  const centroid = durationLabel(cluster.centroid).padStart(8);
  const spread = `±${durationLabel(cluster.spread)}`.padStart(8);
  return `${label} ${bar} ${centroid} ${spread} ${count} entries`;
}

export function renderClusteringPanel(
  box: blessed.Widgets.BoxElement,
  store: ClusterStore,
): void {
  const { clusters } = store;
  if (clusters.length === 0) {
    box.setContent('{center}No cluster data available{/center}');
    box.screen.render();
    return;
  }

  const maxCentroid = Math.max(...clusters.map((c) => c.centroid));
  const header = `${'Cluster'.padEnd(10)} ${'Duration bar'.padEnd(12)} ${'Centroid'.padStart(8)} ${'Spread'.padStart(8)} Count`;
  const divider = '─'.repeat(header.length);
  const rows = clusters
    .slice()
    .sort((a, b) => a.centroid - b.centroid)
    .map((c) => formatClusterRow(c, maxCentroid));

  box.setContent([header, divider, ...rows].join('\n'));
  box.screen.render();
}

export function createClusteringPanel(
  parent: blessed.Widgets.Screen | blessed.Widgets.BoxElement,
  options: Partial<blessed.Widgets.BoxOptions> = {},
): blessed.Widgets.BoxElement {
  const box = blessed.box({
    label: ' Deployment Clusters ',
    border: { type: 'line' },
    scrollable: true,
    keys: true,
    vi: true,
    tags: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'cyan' } },
    ...options,
  });
  (parent as blessed.Widgets.Screen).append
    ? (parent as blessed.Widgets.Screen).append(box)
    : (parent as blessed.Widgets.BoxElement).append(box);
  return box;
}

export function refresh(
  box: blessed.Widgets.BoxElement,
  store: ClusterStore,
): void {
  renderClusteringPanel(box, store);
}
