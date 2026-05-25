export interface RemediationAction {
  id: string;
  entryKey: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  assignee?: string;
}

export interface RemediationStore {
  actions: RemediationAction[];
}

export function emptyRemediationStore(): RemediationStore {
  return { actions: [] };
}

export function generateRemediationId(): string {
  return `rem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createRemediation(
  entryKey: string,
  title: string,
  description: string,
  assignee?: string
): RemediationAction {
  const now = Date.now();
  return {
    id: generateRemediationId(),
    entryKey,
    title,
    description,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    assignee,
  };
}

export function addRemediation(
  store: RemediationStore,
  action: RemediationAction
): RemediationStore {
  return { actions: [...store.actions, action] };
}

export function updateRemediationStatus(
  store: RemediationStore,
  id: string,
  status: RemediationAction['status']
): RemediationStore {
  const now = Date.now();
  return {
    actions: store.actions.map((a) =>
      a.id === id
        ? {
            ...a,
            status,
            updatedAt: now,
            resolvedAt: status === 'resolved' ? now : a.resolvedAt,
          }
        : a
    ),
  };
}

export function getRemediationsForEntry(
  store: RemediationStore,
  entryKey: string
): RemediationAction[] {
  return store.actions.filter((a) => a.entryKey === entryKey);
}

export function pruneRemediation(
  store: RemediationStore,
  maxAge: number
): RemediationStore {
  const cutoff = Date.now() - maxAge;
  return {
    actions: store.actions.filter(
      (a) => a.status === 'pending' || a.status === 'in_progress' || a.updatedAt >= cutoff
    ),
  };
}
