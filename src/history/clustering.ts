import { HistoryEntry } from './history';

export interface Cluster {
  id: string;
  label: string;
  entries: HistoryEntry[];
  centroid: number;
  spread: number;
}

export interface ClusterStore {
  clusters: Cluster[];
  generatedAt: string;
}

export function emptyClusterStore(): ClusterStore {
  return { clusters: [], generatedAt: new Date().toISOString() };
}

function durationMs(entry: HistoryEntry): number {
  if (!entry.startedAt || !entry.finishedAt) return 0;
  return new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime();
}

export function kMeansClusters(
  entries: HistoryEntry[],
  k = 3,
): Cluster[] {
  if (entries.length === 0) return [];

  const values = entries.map(durationMs);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / Math.max(k, 1);

  let centroids = Array.from({ length: k }, (_, i) => min + step * i + step / 2);

  for (let iter = 0; iter < 10; iter++) {
    const buckets: number[][] = centroids.map(() => []);
    values.forEach((v) => {
      const idx = centroids
        .map((c, i) => ({ d: Math.abs(c - v), i }))
        .sort((a, b) => a.d - b.d)[0].i;
      buckets[idx].push(v);
    });
    centroids = buckets.map((b) =>
      b.length ? b.reduce((s, x) => s + x, 0) / b.length : 0,
    );
  }

  const labels = ['fast', 'medium', 'slow', 'very-slow', 'critical'];

  return centroids.map((centroid, i) => {
    const members = entries.filter((e) => {
      const v = durationMs(e);
      const nearest = centroids
        .map((c, j) => ({ d: Math.abs(c - v), j }))
        .sort((a, b) => a.d - b.d)[0].j;
      return nearest === i;
    });
    const memberValues = members.map(durationMs);
    const spread =
      memberValues.length > 1
        ? Math.sqrt(
            memberValues.reduce((s, v) => s + Math.pow(v - centroid, 2), 0) /
              memberValues.length,
          )
        : 0;
    return {
      id: `cluster-${i}`,
      label: labels[i] ?? `cluster-${i}`,
      entries: members,
      centroid,
      spread,
    };
  });
}

export function buildClusterStore(
  entries: HistoryEntry[],
  k = 3,
): ClusterStore {
  return {
    clusters: kMeansClusters(entries, k),
    generatedAt: new Date().toISOString(),
  };
}
