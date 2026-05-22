import {
  emptyLabelStore,
  addLabel,
  removeLabel,
  getLabels,
  filterByLabel,
  allLabels,
  pruneLabels,
} from "./labels";

describe("labels", () => {
  it("starts empty", () => {
    const store = emptyLabelStore();
    expect(store.entries).toEqual({});
  });

  it("adds a label to an entry", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "hotfix");
    expect(getLabels(store, "e1")).toEqual(["hotfix"]);
  });

  it("trims whitespace from label", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "  prod  ");
    expect(getLabels(store, "e1")).toEqual(["prod"]);
  });

  it("ignores empty labels", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "   ");
    expect(getLabels(store, "e1")).toEqual([]);
  });

  it("does not duplicate labels", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "hotfix");
    store = addLabel(store, "e1", "hotfix");
    expect(getLabels(store, "e1")).toEqual(["hotfix"]);
  });

  it("removes a label", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "hotfix");
    store = addLabel(store, "e1", "prod");
    store = removeLabel(store, "e1", "hotfix");
    expect(getLabels(store, "e1")).toEqual(["prod"]);
  });

  it("removes entry key when last label removed", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "hotfix");
    store = removeLabel(store, "e1", "hotfix");
    expect(store.entries["e1"]).toBeUndefined();
  });

  it("filterByLabel returns matching entry ids", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "prod");
    store = addLabel(store, "e2", "staging");
    store = addLabel(store, "e3", "prod");
    expect(filterByLabel(store, "prod").sort()).toEqual(["e1", "e3"]);
  });

  it("allLabels returns sorted unique labels", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "prod");
    store = addLabel(store, "e2", "hotfix");
    store = addLabel(store, "e3", "prod");
    expect(allLabels(store)).toEqual(["hotfix", "prod"]);
  });

  it("pruneLabels removes entries not in keepIds", () => {
    let store = emptyLabelStore();
    store = addLabel(store, "e1", "prod");
    store = addLabel(store, "e2", "hotfix");
    const pruned = pruneLabels(store, new Set(["e1"]));
    expect(pruned.entries["e1"]).toEqual(["prod"]);
    expect(pruned.entries["e2"]).toBeUndefined();
  });
});
