import {
  emptyBudgetStore,
  addBudget,
  removeBudget,
  getBudgets,
  evaluateBudget,
  evaluateAllBudgets,
  Budget,
} from './budgets';
import { HistoryEntry } from './history';

function makeEntry(
  provider: string,
  status: string,
  durationMs: number,
  offsetMs = 0
): HistoryEntry {
  const start = new Date(Date.now() - offsetMs);
  const finish = new Date(start.getTime() + durationMs);
  return {
    id: Math.random().toString(36).slice(2),
    provider,
    name: 'deploy',
    status,
    startedAt: start.toISOString(),
    finishedAt: finish.toISOString(),
    meta: {},
  } as unknown as HistoryEntry;
}

const baseBudget: Omit<Budget, 'id' | 'createdAt'> = {
  name: 'prod-budget',
  provider: 'github',
  maxDurationMs: 60_000,
  maxFailureRate: 0.1,
  windowDays: 7,
};

describe('addBudget / removeBudget', () => {
  it('adds a budget with generated id', () => {
    const store = addBudget(emptyBudgetStore(), baseBudget);
    expect(store.budgets).toHaveLength(1);
    expect(store.budgets[0].id).toMatch(/^bgt_/);
    expect(store.budgets[0].name).toBe('prod-budget');
  });

  it('removes a budget by id', () => {
    let store = addBudget(emptyBudgetStore(), baseBudget);
    const id = store.budgets[0].id;
    store = removeBudget(store, id);
    expect(store.budgets).toHaveLength(0);
  });
});

describe('getBudgets', () => {
  it('filters by provider', () => {
    let store = addBudget(emptyBudgetStore(), baseBudget);
    store = addBudget(store, { ...baseBudget, provider: 'vercel' });
    expect(getBudgets(store, 'github')).toHaveLength(1);
    expect(getBudgets(store, 'vercel')).toHaveLength(1);
    expect(getBudgets(store)).toHaveLength(2);
  });
});

describe('evaluateBudget', () => {
  it('reports no breach when within limits', () => {
    const store = addBudget(emptyBudgetStore(), baseBudget);
    const entries = [makeEntry('github', 'success', 30_000)];
    const result = evaluateBudget(store.budgets[0], entries);
    expect(result.breached).toBe(false);
    expect(result.durationBreached).toBe(false);
    expect(result.failureRateBreached).toBe(false);
  });

  it('detects duration breach', () => {
    const store = addBudget(emptyBudgetStore(), baseBudget);
    const entries = [makeEntry('github', 'success', 120_000)];
    const result = evaluateBudget(store.budgets[0], entries);
    expect(result.durationBreached).toBe(true);
    expect(result.breached).toBe(true);
  });

  it('detects failure rate breach', () => {
    const store = addBudget(emptyBudgetStore(), baseBudget);
    const entries = [
      makeEntry('github', 'failure', 10_000),
      makeEntry('github', 'failure', 10_000),
      makeEntry('github', 'success', 10_000),
    ];
    const result = evaluateBudget(store.budgets[0], entries);
    expect(result.failureRateBreached).toBe(true);
  });

  it('ignores entries outside the window', () => {
    const store = addBudget(emptyBudgetStore(), baseBudget);
    const oldEntry = makeEntry('github', 'failure', 10_000, 10 * 86_400_000);
    const result = evaluateBudget(store.budgets[0], [oldEntry]);
    expect(result.actualFailureRate).toBe(0);
  });
});

describe('evaluateAllBudgets', () => {
  it('evaluates all budgets', () => {
    let store = addBudget(emptyBudgetStore(), baseBudget);
    store = addBudget(store, { ...baseBudget, provider: 'vercel' });
    const entries = [makeEntry('github', 'success', 10_000)];
    const results = evaluateAllBudgets(store, entries);
    expect(results).toHaveLength(2);
  });
});
