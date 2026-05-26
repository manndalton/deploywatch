export type EnvironmentName = 'production' | 'preview' | 'development' | string;

export interface EnvironmentRecord {
  id: string;
  name: EnvironmentName;
  entryId: string;
  provider: string;
  branch?: string;
  url?: string;
  recordedAt: number;
}

export interface EnvironmentStore {
  records: EnvironmentRecord[];
}

export function emptyEnvironmentStore(): EnvironmentStore {
  return { records: [] };
}

export function generateEnvironmentId(): string {
  return `env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addEnvironmentRecord(
  store: EnvironmentStore,
  record: Omit<EnvironmentRecord, 'id' | 'recordedAt'>
): EnvironmentStore {
  const entry: EnvironmentRecord = {
    ...record,
    id: generateEnvironmentId(),
    recordedAt: Date.now(),
  };
  return { records: [...store.records, entry] };
}

export function getEnvironmentRecords(
  store: EnvironmentStore,
  name: EnvironmentName
): EnvironmentRecord[] {
  return store.records.filter((r) => r.name === name);
}

export function getRecordsByEntry(
  store: EnvironmentStore,
  entryId: string
): EnvironmentRecord[] {
  return store.records.filter((r) => r.entryId === entryId);
}

export function pruneEnvironmentStore(
  store: EnvironmentStore,
  maxAge: number
): EnvironmentStore {
  const cutoff = Date.now() - maxAge;
  return { records: store.records.filter((r) => r.recordedAt >= cutoff) };
}

export function summarizeEnvironments(
  store: EnvironmentStore
): Record<EnvironmentName, number> {
  return store.records.reduce<Record<string, number>>((acc, r) => {
    acc[r.name] = (acc[r.name] ?? 0) + 1;
    return acc;
  }, {});
}
