/**
 * Silencing: suppress alerts/notifications for known noisy deployments
 * during maintenance windows or manual overrides.
 */

export interface SilenceRule {
  id: string;
  pattern: string; // glob-style match against deployment key (provider:repo:env)
  reason: string;
  createdAt: string; // ISO
  expiresAt: string | null; // ISO or null = permanent
}

export interface SilenceStore {
  rules: SilenceRule[];
}

export function emptySilenceStore(): SilenceStore {
  return { rules: [] };
}

function generateId(): string {
  return `sil_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createSilenceRule(
  pattern: string,
  reason: string,
  expiresAt: string | null = null
): SilenceRule {
  return {
    id: generateId(),
    pattern,
    reason,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
}

export function addSilenceRule(store: SilenceStore, rule: SilenceRule): SilenceStore {
  return { rules: [...store.rules, rule] };
}

export function removeSilenceRule(store: SilenceStore, id: string): SilenceStore {
  return { rules: store.rules.filter((r) => r.id !== id) };
}

export function pruneExpired(store: SilenceStore, now = new Date().toISOString()): SilenceStore {
  return {
    rules: store.rules.filter((r) => r.expiresAt === null || r.expiresAt > now),
  };
}

function matchesPattern(pattern: string, key: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(key);
}

export function isSilenced(
  store: SilenceStore,
  deploymentKey: string,
  now = new Date().toISOString()
): boolean {
  const active = pruneExpired(store, now);
  return active.rules.some((r) => matchesPattern(r.pattern, deploymentKey));
}

export function listSilenceRules(store: SilenceStore): SilenceRule[] {
  return [...store.rules];
}
