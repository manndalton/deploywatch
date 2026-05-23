import {
  emptyDependencyStore,
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  pruneDependencies,
} from "./dependencies";

describe("dependencies", () => {
  it("starts empty", () => {
    expect(emptyDependencyStore().links).toHaveLength(0);
  });

  it("adds a dependency link", () => {
    const store = addDependency(emptyDependencyStore(), "a", "b", "needs");
    expect(store.links).toHaveLength(1);
    expect(store.links[0].dependentKey).toBe("a");
    expect(store.links[0].dependsOnKey).toBe("b");
    expect(store.links[0].label).toBe("needs");
  });

  it("does not add duplicate links", () => {
    let store = addDependency(emptyDependencyStore(), "a", "b");
    store = addDependency(store, "a", "b");
    expect(store.links).toHaveLength(1);
  });

  it("throws when an entry depends on itself", () => {
    expect(() => addDependency(emptyDependencyStore(), "a", "a")).toThrow();
  });

  it("removes a dependency link", () => {
    let store = addDependency(emptyDependencyStore(), "a", "b");
    store = removeDependency(store, "a", "b");
    expect(store.links).toHaveLength(0);
  });

  it("getDependencies returns what an entry depends on", () => {
    let store = addDependency(emptyDependencyStore(), "a", "b");
    store = addDependency(store, "a", "c");
    store = addDependency(store, "d", "b");
    const deps = getDependencies(store, "a");
    expect(deps).toHaveLength(2);
    expect(deps.map((d) => d.dependsOnKey).sort()).toEqual(["b", "c"]);
  });

  it("getDependents returns entries that depend on a key", () => {
    let store = addDependency(emptyDependencyStore(), "a", "b");
    store = addDependency(store, "c", "b");
    const dependents = getDependents(store, "b");
    expect(dependents).toHaveLength(2);
    expect(dependents.map((d) => d.dependentKey).sort()).toEqual(["a", "c"]);
  });

  it("prunes links whose keys are no longer valid", () => {
    let store = addDependency(emptyDependencyStore(), "a", "b");
    store = addDependency(store, "a", "c");
    store = addDependency(store, "d", "b");
    const pruned = pruneDependencies(store, new Set(["a", "b"]));
    expect(pruned.links).toHaveLength(1);
    expect(pruned.links[0].dependentKey).toBe("a");
    expect(pruned.links[0].dependsOnKey).toBe("b");
  });
});
