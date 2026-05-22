/**
 * Annotations: attach free-form notes to history entries.
 */

import { HistoryEntry } from './history';

export interface Annotation {
  entryId: string;
  note: string;
  createdAt: string;
  author?: string;
}

export type AnnotationMap = Record<string, Annotation[]>;

/** Add an annotation to an entry. Returns updated map. */
export function addAnnotation(
  map: AnnotationMap,
  entryId: string,
  note: string,
  author?: string
): AnnotationMap {
  const existing = map[entryId] ?? [];
  const annotation: Annotation = {
    entryId,
    note: note.trim(),
    createdAt: new Date().toISOString(),
    ...(author ? { author } : {}),
  };
  return { ...map, [entryId]: [...existing, annotation] };
}

/** Remove all annotations for a given entryId. */
export function removeAnnotations(
  map: AnnotationMap,
  entryId: string
): AnnotationMap {
  const next = { ...map };
  delete next[entryId];
  return next;
}

/** Retrieve annotations for a single entry, newest first. */
export function getAnnotations(
  map: AnnotationMap,
  entryId: string
): Annotation[] {
  const list = map[entryId] ?? [];
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Purge annotations whose entryIds are not present in the given entry list. */
export function pruneAnnotations(
  map: AnnotationMap,
  entries: HistoryEntry[]
): AnnotationMap {
  const ids = new Set(entries.map((e) => e.id));
  return Object.fromEntries(
    Object.entries(map).filter(([id]) => ids.has(id))
  );
}
