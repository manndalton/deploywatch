/**
 * Feedback store: allows users to attach thumbs-up/down ratings and freeform
 * notes to deployment history entries.
 */

export type FeedbackRating = 'positive' | 'negative' | 'neutral';

export interface FeedbackEntry {
  id: string;
  entryId: string;
  rating: FeedbackRating;
  note: string;
  author: string;
  createdAt: number;
}

export interface FeedbackStore {
  items: FeedbackEntry[];
}

export function emptyFeedbackStore(): FeedbackStore {
  return { items: [] };
}

let _counter = 0;
export function generateFeedbackId(): string {
  return `fb-${Date.now()}-${++_counter}`;
}

export function addFeedback(
  store: FeedbackStore,
  entryId: string,
  rating: FeedbackRating,
  note: string,
  author: string,
): FeedbackStore {
  const entry: FeedbackEntry = {
    id: generateFeedbackId(),
    entryId,
    rating,
    note: note.trim(),
    author: author.trim(),
    createdAt: Date.now(),
  };
  return { items: [...store.items, entry] };
}

export function removeFeedback(store: FeedbackStore, id: string): FeedbackStore {
  return { items: store.items.filter((f) => f.id !== id) };
}

export function getFeedbackForEntry(
  store: FeedbackStore,
  entryId: string,
): FeedbackEntry[] {
  return store.items.filter((f) => f.entryId === entryId);
}

export function summariseFeedback(
  store: FeedbackStore,
  entryId: string,
): { positive: number; negative: number; neutral: number } {
  const items = getFeedbackForEntry(store, entryId);
  return {
    positive: items.filter((f) => f.rating === 'positive').length,
    negative: items.filter((f) => f.rating === 'negative').length,
    neutral: items.filter((f) => f.rating === 'neutral').length,
  };
}

export function pruneFeedback(
  store: FeedbackStore,
  keepEntryIds: Set<string>,
): FeedbackStore {
  return { items: store.items.filter((f) => keepEntryIds.has(f.entryId)) };
}
