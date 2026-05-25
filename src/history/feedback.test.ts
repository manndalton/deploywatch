import {
  emptyFeedbackStore,
  addFeedback,
  removeFeedback,
  getFeedbackForEntry,
  summariseFeedback,
  pruneFeedback,
  FeedbackStore,
} from './feedback';

function makeStore(...overrides: Partial<FeedbackStore>[]): FeedbackStore {
  return Object.assign(emptyFeedbackStore(), ...overrides);
}

describe('addFeedback', () => {
  it('appends a new feedback entry', () => {
    const s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', 'Looks good', 'alice');
    expect(s.items).toHaveLength(1);
    expect(s.items[0].entryId).toBe('e1');
    expect(s.items[0].rating).toBe('positive');
    expect(s.items[0].note).toBe('Looks good');
    expect(s.items[0].author).toBe('alice');
  });

  it('trims whitespace from note and author', () => {
    const s = addFeedback(emptyFeedbackStore(), 'e1', 'neutral', '  nice  ', '  bob  ');
    expect(s.items[0].note).toBe('nice');
    expect(s.items[0].author).toBe('bob');
  });

  it('does not mutate the original store', () => {
    const original = emptyFeedbackStore();
    addFeedback(original, 'e1', 'negative', 'Bad', 'carol');
    expect(original.items).toHaveLength(0);
  });
});

describe('removeFeedback', () => {
  it('removes the entry with the given id', () => {
    let s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', 'ok', 'alice');
    const id = s.items[0].id;
    s = removeFeedback(s, id);
    expect(s.items).toHaveLength(0);
  });

  it('is a no-op for unknown ids', () => {
    const s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', 'ok', 'alice');
    expect(removeFeedback(s, 'nope').items).toHaveLength(1);
  });
});

describe('getFeedbackForEntry', () => {
  it('returns only items matching entryId', () => {
    let s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', 'a', 'alice');
    s = addFeedback(s, 'e2', 'negative', 'b', 'bob');
    expect(getFeedbackForEntry(s, 'e1')).toHaveLength(1);
    expect(getFeedbackForEntry(s, 'e2')[0].rating).toBe('negative');
  });
});

describe('summariseFeedback', () => {
  it('counts ratings correctly', () => {
    let s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', '', 'a');
    s = addFeedback(s, 'e1', 'positive', '', 'b');
    s = addFeedback(s, 'e1', 'negative', '', 'c');
    const summary = summariseFeedback(s, 'e1');
    expect(summary.positive).toBe(2);
    expect(summary.negative).toBe(1);
    expect(summary.neutral).toBe(0);
  });
});

describe('pruneFeedback', () => {
  it('removes feedback whose entryId is not in the keep set', () => {
    let s = addFeedback(emptyFeedbackStore(), 'e1', 'positive', '', 'a');
    s = addFeedback(s, 'e2', 'negative', '', 'b');
    const pruned = pruneFeedback(s, new Set(['e1']));
    expect(pruned.items).toHaveLength(1);
    expect(pruned.items[0].entryId).toBe('e1');
  });
});
