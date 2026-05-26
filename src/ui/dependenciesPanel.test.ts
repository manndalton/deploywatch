import { describe, it, expect, vi } from 'vitest';
import {
  formatDependencyRow,
  renderDependenciesPanel,
  createDependenciesPanel,
} from './dependenciesPanel';
import {
  emptyDependencyStore,
  addDependency,
} from '../history/dependencies';
import type { HistoryEntry } from '../history/history';

function makeEntry(id: string, repo: string): HistoryEntry {
  return {
    id,
    repo,
    branch: 'main',
    status: 'success',
    startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    finishedAt: new Date('2024-01-01T10:05:00Z').toISOString(),
    provider: 'github',
    tags: [],
  };
}

function makeBox() {
  const lines: string[] = [];
  return {
    setContent: (s: string) => { lines.push(s); },
    render: vi.fn(),
    _lines: lines,
  };
}

describe('formatDependencyRow', () => {
  it('formats a dependency edge with arrow', () => {
    const from = makeEntry('e1', 'org/api');
    const to = makeEntry('e2', 'org/web');
    const row = formatDependencyRow(from, to, false);
    expect(row).toContain('org/api');
    expect(row).toContain('org/web');
    expect(row).toContain('→');
  });

  it('flags cyclic edges', () => {
    const from = makeEntry('e1', 'org/a');
    const to = makeEntry('e2', 'org/b');
    const row = formatDependencyRow(from, to, true);
    expect(row).toContain('CYCLE');
  });
});

describe('renderDependenciesPanel', () => {
  it('renders empty state when no dependencies', () => {
    const store = emptyDependencyStore();
    const entries: HistoryEntry[] = [];
    const result = renderDependenciesPanel(store, entries);
    expect(result).toContain('No dependencies');
  });

  it('renders rows for each edge', () => {
    const e1 = makeEntry('e1', 'org/api');
    const e2 = makeEntry('e2', 'org/web');
    let store = emptyDependencyStore();
    store = addDependency(store, 'e1', 'e2');
    const result = renderDependenciesPanel(store, [e1, e2]);
    expect(result).toContain('org/api');
    expect(result).toContain('org/web');
  });
});

describe('createDependenciesPanel', () => {
  it('calls setContent and render', () => {
    const box = makeBox();
    const store = emptyDependencyStore();
    const panel = createDependenciesPanel(box as any, store, []);
    panel.refresh(store, []);
    expect(box.render).toHaveBeenCalled();
  });
});
