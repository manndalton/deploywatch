import {
  addAnnotation,
  removeAnnotations,
  getAnnotations,
  pruneAnnotations,
  AnnotationMap,
} from './annotations';
import { HistoryEntry } from './history';

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-01T00:01:00Z',
    durationMs: 60000,
    tags: [],
  };
}

describe('addAnnotation', () => {
  it('adds a note to an empty map', () => {
    const map = addAnnotation({}, 'abc', 'first note');
    expect(map['abc']).toHaveLength(1);
    expect(map['abc'][0].note).toBe('first note');
  });

  it('appends multiple notes', () => {
    let map: AnnotationMap = {};
    map = addAnnotation(map, 'abc', 'note 1');
    map = addAnnotation(map, 'abc', 'note 2');
    expect(map['abc']).toHaveLength(2);
  });

  it('trims whitespace from note', () => {
    const map = addAnnotation({}, 'abc', '  trimmed  ');
    expect(map['abc'][0].note).toBe('trimmed');
  });

  it('stores optional author', () => {
    const map = addAnnotation({}, 'abc', 'note', 'alice');
    expect(map['abc'][0].author).toBe('alice');
  });
});

describe('removeAnnotations', () => {
  it('removes all annotations for an entry', () => {
    let map = addAnnotation({}, 'abc', 'note');
    map = removeAnnotations(map, 'abc');
    expect(map['abc']).toBeUndefined();
  });

  it('leaves other entries intact', () => {
    let map = addAnnotation({}, 'abc', 'note');
    map = addAnnotation(map, 'xyz', 'other');
    map = removeAnnotations(map, 'abc');
    expect(map['xyz']).toHaveLength(1);
  });
});

describe('getAnnotations', () => {
  it('returns empty array for unknown entry', () => {
    expect(getAnnotations({}, 'missing')).toEqual([]);
  });

  it('returns annotations newest first', () => {
    let map: AnnotationMap = {
      abc: [
        { entryId: 'abc', note: 'old', createdAt: '2024-01-01T00:00:00Z' },
        { entryId: 'abc', note: 'new', createdAt: '2024-01-02T00:00:00Z' },
      ],
    };
    const result = getAnnotations(map, 'abc');
    expect(result[0].note).toBe('new');
  });
});

describe('pruneAnnotations', () => {
  it('removes annotations for entries not in list', () => {
    const map: AnnotationMap = {
      abc: [{ entryId: 'abc', note: 'keep', createdAt: '' }],
      xyz: [{ entryId: 'xyz', note: 'drop', createdAt: '' }],
    };
    const result = pruneAnnotations(map, [makeEntry('abc')]);
    expect(result['abc']).toBeDefined();
    expect(result['xyz']).toBeUndefined();
  });
});
