export {
  emptyDependencyStore,
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  hasCycle,
} from './dependencies';

export type { DependencyStore, DependencyEdge } from './dependencies';
