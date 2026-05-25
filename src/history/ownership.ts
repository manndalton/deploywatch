export interface Owner {
  id: string;
  name: string;
  email?: string;
  team?: string;
}

export interface OwnershipEntry {
  entryKey: string;
  owners: Owner[];
  assignedAt: number;
}

export interface OwnershipStore {
  records: Record<string, OwnershipEntry>;
}

export function emptyOwnershipStore(): OwnershipStore {
  return { records: {} };
}

export function generateOwnerId(): string {
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function assignOwner(
  store: OwnershipStore,
  entryKey: string,
  owner: Omit<Owner, 'id'>
): OwnershipStore {
  const existing = store.records[entryKey];
  const newOwner: Owner = { id: generateOwnerId(), ...owner };
  const owners = existing ? [...existing.owners, newOwner] : [newOwner];
  return {
    ...store,
    records: {
      ...store.records,
      [entryKey]: { entryKey, owners, assignedAt: Date.now() },
    },
  };
}

export function removeOwner(
  store: OwnershipStore,
  entryKey: string,
  ownerId: string
): OwnershipStore {
  const existing = store.records[entryKey];
  if (!existing) return store;
  const owners = existing.owners.filter((o) => o.id !== ownerId);
  const records = { ...store.records };
  if (owners.length === 0) {
    delete records[entryKey];
  } else {
    records[entryKey] = { ...existing, owners };
  }
  return { ...store, records };
}

export function getOwners(
  store: OwnershipStore,
  entryKey: string
): Owner[] {
  return store.records[entryKey]?.owners ?? [];
}

export function findEntriesByOwner(
  store: OwnershipStore,
  ownerId: string
): string[] {
  return Object.values(store.records)
    .filter((r) => r.owners.some((o) => o.id === ownerId))
    .map((r) => r.entryKey);
}

export function findEntriesByTeam(
  store: OwnershipStore,
  team: string
): string[] {
  return Object.values(store.records)
    .filter((r) => r.owners.some((o) => o.team === team))
    .map((r) => r.entryKey);
}
