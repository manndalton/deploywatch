/**
 * Track relationships between deployment entries.
 * A dependency links one entry (dependent) to another (dependency).
 */

export interface Dependency {
  dependentKey: string;
  dependsOnKey: string;
  label?: string;
  createdAt: string;
}

export interface DependencyStore {
  links: Dependency[];
}

export function emptyDependencyStore(): DependencyStore {
  return { links: [] };
}

export function addDependency(
  store: DependencyStore,
  dependentKey: string,
  dependsOnKey: string,
  label?: string
): DependencyStore {
  if (dependentKey === dependsOnKey) {
    throw new Error("An entry cannot depend on itself.");
  }
  const already = store.links.some(
    (l) => l.dependentKey === dependentKey && l.dependsOnKey === dependsOnKey
  );
  if (already) return store;
  return {
    links: [
      ...store.links,
      { dependentKey, dependsOnKey, label, createdAt: new Date().toISOString() },
    ],
  };
}

export function removeDependency(
  store: DependencyStore,
  dependentKey: string,
  dependsOnKey: string
): DependencyStore {
  return {
    links: store.links.filter(
      (l) => !(l.dependentKey === dependentKey && l.dependsOnKey === dependsOnKey)
    ),
  };
}

export function getDependencies(
  store: DependencyStore,
  dependentKey: string
): Dependency[] {
  return store.links.filter((l) => l.dependentKey === dependentKey);
}

export function getDependents(
  store: DependencyStore,
  dependsOnKey: string
): Dependency[] {
  return store.links.filter((l) => l.dependsOnKey === dependsOnKey);
}

export function pruneDependencies(
  store: DependencyStore,
  validKeys: Set<string>
): DependencyStore {
  return {
    links: store.links.filter(
      (l) => validKeys.has(l.dependentKey) && validKeys.has(l.dependsOnKey)
    ),
  };
}
