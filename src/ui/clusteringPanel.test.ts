import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatClusterRow, renderClusteringPanel } from './clusteringPanel';
import { Cluster, ClusterStore } from '../history/clustering';
import { HistoryEntry } from '../history/history';

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    status: 'success',
    startedAt: '2024-01-01T00:00:00.000Z',
    finishedAt: '2024-01-01T00:01:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  } as HistoryEntry;
}

function makeCluster(id: string, label: string, centroid: number): Cluster {
  return {
    id,
    label,
    entries: [makeEntry(`e-${id}`)],
    centroid,
    spread: centroid * 0.1,
  };
}

function makeBox() {
  return {
    setContent: vi.fn(),
    screen: { render: vi.fn() },
  } as any;
}

describe('formatClusterRow', () => {
  it('includes cluster label', () => {
    const cluster = makeCluster('c1', 'fast', 1000);
    const row = formatClusterRow(cluster, 10000);
    expect(row).toContain('fast');
  });

  it('includes entry count', () => {
    const cluster = makeCluster('c2', 'slow', 8000);
    cluster.entries.push(makeEntry('extra'));
    const row = formatClusterRow(cluster, 10000);
    expect(row).toContain('2');
  });

  it('shows duration label in seconds', () => {
    const cluster = makeCluster('c3', 'medium', 5000);
    const row = formatClusterRow(cluster, 10000);
    expect(row).toContain('5.0s');
  });
});

describe('renderClusteringPanel', () => {
  it('shows no-data message when store is empty', () => {
    const box = makeBox();
    const store: ClusterStore = { clusters: [], generatedAt: new Date().toISOString() };
    renderClusteringPanel(box, store);
    expect(box.setContent).toHaveBeenCalledWith(
      expect.stringContaining('No cluster data'),
    );
  });

  it('renders rows for each cluster', () => {
    const box = makeBox();
    const store: ClusterStore = {
      clusters: [
        makeCluster('c1', 'fast', 1000),
        makeCluster('c2', 'slow', 9000),
      ],
      generatedAt: new Date().toISOString(),
    };
    renderClusteringPanel(box, store);
    const content: string = box.setContent.mock.calls[0][0];
    expect(content).toContain('fast');
    expect(content).toContain('slow');
  });

  it('calls screen.render', () => {
    const box = makeBox();
    const store: ClusterStore = {
      clusters: [makeCluster('c1', 'fast', 500)],
      generatedAt: new Date().toISOString(),
    };
    renderClusteringPanel(box, store);
    expect(box.screen.render).toHaveBeenCalled();
  });
});
