import {
  emptyPipelineStore,
  addPipelineRecord,
  getPipelineRecord,
  updateStage,
  computeStageDuration,
  totalPipelineDuration,
  removePipelineRecord,
  PipelineStage,
} from "./pipeline";

const baseStages: PipelineStage[] = [
  { name: "build", status: "success", durationMs: 12000 },
  { name: "test", status: "success", durationMs: 8000 },
  { name: "deploy", status: "running" },
];

describe("emptyPipelineStore", () => {
  it("returns a store with no records", () => {
    expect(emptyPipelineStore()).toEqual({ records: {} });
  });
});

describe("addPipelineRecord", () => {
  it("adds a record keyed by entryId", () => {
    const store = addPipelineRecord(emptyPipelineStore(), "e1", baseStages);
    expect(store.records["e1"]).toBeDefined();
    expect(store.records["e1"].stages).toHaveLength(3);
  });

  it("does not mutate the original store", () => {
    const original = emptyPipelineStore();
    addPipelineRecord(original, "e1", baseStages);
    expect(original.records).toEqual({});
  });
});

describe("getPipelineRecord", () => {
  it("returns the record for a known entryId", () => {
    const store = addPipelineRecord(emptyPipelineStore(), "e1", baseStages);
    expect(getPipelineRecord(store, "e1")?.entryId).toBe("e1");
  });

  it("returns undefined for unknown entryId", () => {
    expect(getPipelineRecord(emptyPipelineStore(), "nope")).toBeUndefined();
  });
});

describe("updateStage", () => {
  it("patches the named stage", () => {
    let store = addPipelineRecord(emptyPipelineStore(), "e1", baseStages);
    store = updateStage(store, "e1", "deploy", { status: "success", durationMs: 5000 });
    const stage = store.records["e1"].stages.find((s) => s.name === "deploy");
    expect(stage?.status).toBe("success");
    expect(stage?.durationMs).toBe(5000);
  });

  it("returns unchanged store if entryId not found", () => {
    const store = emptyPipelineStore();
    expect(updateStage(store, "missing", "build", { status: "failure" })).toBe(store);
  });
});

describe("computeStageDuration", () => {
  it("computes duration from timestamps", () => {
    const stage: PipelineStage = {
      name: "build",
      status: "success",
      startedAt: "2024-01-01T00:00:00.000Z",
      finishedAt: "2024-01-01T00:00:10.000Z",
    };
    expect(computeStageDuration(stage)).toBe(10000);
  });

  it("returns undefined when timestamps are missing", () => {
    expect(computeStageDuration({ name: "x", status: "pending" })).toBeUndefined();
  });
});

describe("totalPipelineDuration", () => {
  it("sums all stage durations", () => {
    const store = addPipelineRecord(emptyPipelineStore(), "e1", baseStages);
    expect(totalPipelineDuration(store.records["e1"])).toBe(20000);
  });
});

describe("removePipelineRecord", () => {
  it("removes the record for the given entryId", () => {
    let store = addPipelineRecord(emptyPipelineStore(), "e1", baseStages);
    store = removePipelineRecord(store, "e1");
    expect(store.records["e1"]).toBeUndefined();
  });
});
