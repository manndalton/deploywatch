export type AuditAction =
  | 'annotation.add'
  | 'annotation.remove'
  | 'bookmark.add'
  | 'bookmark.remove'
  | 'label.add'
  | 'label.remove'
  | 'snapshot.create'
  | 'snapshot.prune'
  | 'alert.acknowledge'
  | 'alert.remove'
  | 'comment.add'
  | 'comment.edit'
  | 'comment.remove';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  targetId: string;
  actor: string;
  detail?: string;
}

export interface AuditStore {
  entries: AuditEntry[];
}

export function emptyAuditStore(): AuditStore {
  return { entries: [] };
}

let _counter = 0;
function generateId(): string {
  return `audit-${Date.now()}-${++_counter}`;
}

export function recordAudit(
  store: AuditStore,
  action: AuditAction,
  targetId: string,
  actor: string,
  detail?: string
): AuditStore {
  const entry: AuditEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    targetId,
    actor,
    detail,
  };
  return { entries: [...store.entries, entry] };
}

export function getAuditLog(
  store: AuditStore,
  targetId?: string
): AuditEntry[] {
  if (!targetId) return [...store.entries];
  return store.entries.filter((e) => e.targetId === targetId);
}

export function pruneAuditLog(
  store: AuditStore,
  maxEntries: number
): AuditStore {
  if (store.entries.length <= maxEntries) return store;
  return { entries: store.entries.slice(store.entries.length - maxEntries) };
}

export function filterAuditByAction(
  store: AuditStore,
  action: AuditAction
): AuditEntry[] {
  return store.entries.filter((e) => e.action === action);
}
