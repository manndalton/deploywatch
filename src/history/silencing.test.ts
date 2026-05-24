import {
  emptySilenceStore,
  createSilenceRule,
  addSilenceRule,
  removeSilenceRule,
  pruneExpired,
  isSilenced,
  listSilenceRules,
} from './silencing';

const PAST = '2000-01-01T00:00:00.000Z';
const FUTURE = '2099-12-31T23:59:59.000Z';
const NOW = '2024-06-01T12:00:00.000Z';

describe('createSilenceRule', () => {
  it('creates a rule with generated id and timestamps', () => {
    const rule = createSilenceRule('github:my-repo:production', 'maintenance', FUTURE);
    expect(rule.id).toMatch(/^sil_/);
    expect(rule.pattern).toBe('github:my-repo:production');
    expect(rule.reason).toBe('maintenance');
    expect(rule.expiresAt).toBe(FUTURE);
  });

  it('allows permanent rules (expiresAt null)', () => {
    const rule = createSilenceRule('vercel:*', 'suppress all vercel');
    expect(rule.expiresAt).toBeNull();
  });
});

describe('addSilenceRule / removeSilenceRule', () => {
  it('adds and removes rules immutably', () => {
    const store = emptySilenceStore();
    const rule = createSilenceRule('github:repo:staging', 'test');
    const s1 = addSilenceRule(store, rule);
    expect(s1.rules).toHaveLength(1);
    const s2 = removeSilenceRule(s1, rule.id);
    expect(s2.rules).toHaveLength(0);
    // original unchanged
    expect(store.rules).toHaveLength(0);
  });
});

describe('pruneExpired', () => {
  it('removes rules whose expiresAt is in the past', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('a:*', 'old', PAST));
    store = addSilenceRule(store, createSilenceRule('b:*', 'future', FUTURE));
    store = addSilenceRule(store, createSilenceRule('c:*', 'permanent', null));
    const pruned = pruneExpired(store, NOW);
    expect(pruned.rules.map((r) => r.pattern)).toEqual(['b:*', 'c:*']);
  });
});

describe('isSilenced', () => {
  it('returns true when a non-expired rule matches', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('github:my-repo:*', 'maint', FUTURE));
    expect(isSilenced(store, 'github:my-repo:production', NOW)).toBe(true);
    expect(isSilenced(store, 'github:my-repo:staging', NOW)).toBe(true);
  });

  it('returns false when rule is expired', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('github:my-repo:*', 'old', PAST));
    expect(isSilenced(store, 'github:my-repo:production', NOW)).toBe(false);
  });

  it('returns false when no rule matches', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('vercel:*', 'only vercel', FUTURE));
    expect(isSilenced(store, 'github:my-repo:production', NOW)).toBe(false);
  });

  it('matches exact keys without wildcards', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('github:repo:prod', 'exact', null));
    expect(isSilenced(store, 'github:repo:prod', NOW)).toBe(true);
    expect(isSilenced(store, 'github:repo:staging', NOW)).toBe(false);
  });
});

describe('listSilenceRules', () => {
  it('returns a copy of all rules', () => {
    let store = emptySilenceStore();
    store = addSilenceRule(store, createSilenceRule('*', 'all', null));
    const list = listSilenceRules(store);
    expect(list).toHaveLength(1);
    list.pop();
    expect(store.rules).toHaveLength(1);
  });
});
