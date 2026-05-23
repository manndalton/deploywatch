import { HistoryEntry } from './history';

export interface Milestone {
  id: string;
  label: string;
  entryKey: string;
  createdAt: string;
  note?: string;
}

export interface MilestoneStore {
  milestones: Milestone[];
}

export function emptyMilestoneStore(): MilestoneStore {
  return { milestones: [] };
}

function generateId(): string {
  return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createMilestone(
  entry: HistoryEntry,
  label: string,
  note?: string
): Milestone {
  return {
    id: generateId(),
    label,
    entryKey: `${entry.provider}:${entry.repo}:${entry.runId}`,
    createdAt: new Date().toISOString(),
    note,
  };
}

export function addMilestone(
  store: MilestoneStore,
  milestone: Milestone
): MilestoneStore {
  return { milestones: [...store.milestones, milestone] };
}

export function removeMilestone(
  store: MilestoneStore,
  id: string
): MilestoneStore {
  return { milestones: store.milestones.filter((m) => m.id !== id) };
}

export function listMilestones(store: MilestoneStore): Milestone[] {
  return [...store.milestones].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function findMilestoneByLabel(
  store: MilestoneStore,
  label: string
): Milestone | undefined {
  return store.milestones.find(
    (m) => m.label.toLowerCase() === label.toLowerCase()
  );
}

export function findMilestonesByEntry(
  store: MilestoneStore,
  entry: HistoryEntry
): Milestone[] {
  const key = `${entry.provider}:${entry.repo}:${entry.runId}`;
  return store.milestones.filter((m) => m.entryKey === key);
}
