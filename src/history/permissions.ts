import { HistoryEntry } from './history';

export type Role = 'viewer' | 'editor' | 'admin';

export interface Permission {
  id: string;
  principal: string;
  role: Role;
  resource: string; // e.g. 'entry:<id>', 'tag:<name>', or '*' for all
  grantedAt: string;
}

export interface PermissionStore {
  permissions: Permission[];
}

export function emptyPermissionStore(): PermissionStore {
  return { permissions: [] };
}

export function generatePermissionId(): string {
  return `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function grantPermission(
  store: PermissionStore,
  principal: string,
  role: Role,
  resource: string
): PermissionStore {
  const existing = store.permissions.find(
    p => p.principal === principal && p.resource === resource
  );
  if (existing) {
    return {
      permissions: store.permissions.map(p =>
        p.principal === principal && p.resource === resource
          ? { ...p, role, grantedAt: new Date().toISOString() }
          : p
      ),
    };
  }
  const perm: Permission = {
    id: generatePermissionId(),
    principal,
    role,
    resource,
    grantedAt: new Date().toISOString(),
  };
  return { permissions: [...store.permissions, perm] };
}

export function revokePermission(
  store: PermissionStore,
  principal: string,
  resource: string
): PermissionStore {
  return {
    permissions: store.permissions.filter(
      p => !(p.principal === principal && p.resource === resource)
    ),
  };
}

export function getPermissions(
  store: PermissionStore,
  principal: string
): Permission[] {
  return store.permissions.filter(p => p.principal === principal);
}

export function hasPermission(
  store: PermissionStore,
  principal: string,
  requiredRole: Role,
  resource: string
): boolean {
  const roleRank: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };
  const required = roleRank[requiredRole];
  return store.permissions.some(p => {
    if (p.principal !== principal) return false;
    if (p.resource !== resource && p.resource !== '*') return false;
    return roleRank[p.role] >= required;
  });
}

export function filterEntriesByPermission(
  store: PermissionStore,
  principal: string,
  entries: HistoryEntry[]
): HistoryEntry[] {
  if (hasPermission(store, principal, 'viewer', '*')) return entries;
  return entries.filter(e =>
    hasPermission(store, principal, 'viewer', `entry:${e.id}`)
  );
}
