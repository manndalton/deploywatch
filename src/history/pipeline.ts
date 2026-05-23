/**
 * Pipeline stage tracking for deployment entries.
 * Allows associating named stages (build, test, deploy) with timing data.
 */

export interface PipelineStage {
  name: string;
  status: "pending" | "running" | "success" | "failure" | "skipped";
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface PipelineRecord {
  entryId: string;
  stages: PipelineStage[];
  createdAt: string;
}

export interface PipelineStore {
  records: Record<string, PipelineRecord>;
}

export function emptyPipelineStore(): PipelineStore {
  return { records: {} };
}

export function addPipelineRecord(
  store: PipelineStore,
  entryId: string,
  stages: PipelineStage[]
): PipelineStore {
  const record: PipelineRecord = {
    entryId,
    stages,
    createdAt: new Date().toISOString(),
  };
  return { records: { ...store.records, [entryId]: record } };
}

export function getPipelineRecord(
  store: PipelineStore,
  entryId: string
): PipelineRecord | undefined {
  return store.records[entryId];
}

export function updateStage(
  store: PipelineStore,
  entryId: string,
  stageName: string,
  patch: Partial<PipelineStage>
): PipelineStore {
  const record = store.records[entryId];
  if (!record) return store;
  const stages = record.stages.map((s) =>
    s.name === stageName ? { ...s, ...patch } : s
  );
  return {
    records: {
      ...store.records,
      [entryId]: { ...record, stages },
    },
  };
}

export function computeStageDuration(stage: PipelineStage): number | undefined {
  if (!stage.startedAt || !stage.finishedAt) return undefined;
  return (
    new Date(stage.finishedAt).getTime() - new Date(stage.startedAt).getTime()
  );
}

export function totalPipelineDuration(record: PipelineRecord): number {
  return record.stages.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
}

export function removePipelineRecord(
  store: PipelineStore,
  entryId: string
): PipelineStore {
  const records = { ...store.records };
  delete records[entryId];
  return { records };
}
