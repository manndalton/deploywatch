import {
  emptyPinnedStore,
  addPin,
  removePin,
  isPinned,
  getPins,
  updatePinNote,
} from './pinned';

describe('pinned', () => {
  it('starts empty', () => {
    const store = emptyPinnedStore();
    expect(store.pins).toHaveLength(0);
  });

  it('adds a pin', () => {
    const store = addPin(emptyPinnedStore(), 'key-1', 'My Deploy');
    expect(store.pins).toHaveLength(1);
    expect(store.pins[0].entryKey).toBe('key-1');
    expect(store.pins[0].label).toBe('My Deploy');
  });

  it('does not duplicate pins for same entryKey', () => {
    let store = addPin(emptyPinnedStore(), 'key-1', 'Deploy A');
    store = addPin(store, 'key-1', 'Deploy A again');
    expect(store.pins).toHaveLength(1);
  });

  it('removes a pin', () => {
    let store = addPin(emptyPinnedStore(), 'key-1', 'Deploy A');
    store = addPin(store, 'key-2', 'Deploy B');
    store = removePin(store, 'key-1');
    expect(store.pins).toHaveLength(1);
    expect(store.pins[0].entryKey).toBe('key-2');
  });

  it('checks isPinned correctly', () => {
    const store = addPin(emptyPinnedStore(), 'key-1', 'Deploy A');
    expect(isPinned(store, 'key-1')).toBe(true);
    expect(isPinned(store, 'key-99')).toBe(false);
  });

  it('getPins returns sorted by pinnedAt descending', () => {
    let store = emptyPinnedStore();
    store = addPin(store, 'key-1', 'First');
    store = addPin(store, 'key-2', 'Second');
    const pins = getPins(store);
    expect(pins[0].entryKey).toBe('key-2');
  });

  it('updates pin note', () => {
    let store = addPin(emptyPinnedStore(), 'key-1', 'Deploy A', 'old note');
    store = updatePinNote(store, 'key-1', 'new note');
    expect(store.pins[0].note).toBe('new note');
  });

  it('updatePinNote leaves other pins unchanged', () => {
    let store = addPin(emptyPinnedStore(), 'key-1', 'A');
    store = addPin(store, 'key-2', 'B');
    store = updatePinNote(store, 'key-1', 'updated');
    expect(store.pins.find((p) => p.entryKey === 'key-2')?.note).toBeUndefined();
  });
});
