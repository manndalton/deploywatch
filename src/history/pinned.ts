export interface PinnedEntry {
  id: string;
  entryKey: string;
  label: string;
  pinnedAt: number;
  note?: string;
}

export interface PinnedStore {
  pins: PinnedEntry[];
}

export function emptyPinnedStore(): PinnedStore {
  return { pins: [] };
}

export function generatePinId(): string {
  return `pin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addPin(
  store: PinnedStore,
  entryKey: string,
  label: string,
  note?: string
): PinnedStore {
  const existing = store.pins.find((p) => p.entryKey === entryKey);
  if (existing) return store;
  const pin: PinnedEntry = {
    id: generatePinId(),
    entryKey,
    label,
    pinnedAt: Date.now(),
    note,
  };
  return { pins: [...store.pins, pin] };
}

export function removePin(store: PinnedStore, entryKey: string): PinnedStore {
  return { pins: store.pins.filter((p) => p.entryKey !== entryKey) };
}

export function isPinned(store: PinnedStore, entryKey: string): boolean {
  return store.pins.some((p) => p.entryKey === entryKey);
}

export function getPins(store: PinnedStore): PinnedEntry[] {
  return [...store.pins].sort((a, b) => b.pinnedAt - a.pinnedAt);
}

export function updatePinNote(
  store: PinnedStore,
  entryKey: string,
  note: string
): PinnedStore {
  return {
    pins: store.pins.map((p) =>
      p.entryKey === entryKey ? { ...p, note } : p
    ),
  };
}
