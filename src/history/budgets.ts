import { HistoryEntry } from './history';

export interface Budget {
  id: string;
  name: string;
  provider: string;
  maxDurationMs: number;
  maxFailureRate: number; // 0–1
  windowDays: number;
  createdAt: string;
}

export interface BudgetEvaluation {
  budget: Budget;
  actualDurationMs: number;
  actualFailureRate: number;
  durationBreached: boolean;
  failureRateBreached: boolean;
  breached: boolean;
}

export interface BudgetStore {
  budgets: Budget[];
}

export function emptyBudgetStore(): BudgetStore {
  return { budgets: [] };
}

export function generateBudgetId(): string {
  return `bgt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addBudget(store: BudgetStore, budget: Omit<Budget, 'id' | 'createdAt'>): BudgetStore {
  const entry: Budget = {
    ...budget,
    id: generateBudgetId(),
    createdAt: new Date().toISOString(),
  };
  return { budgets: [...store.budgets, entry] };
}

export function removeBudget(store: BudgetStore, id: string): BudgetStore {
  return { budgets: store.budgets.filter(b => b.id !== id) };
}

export function getBudgets(store: BudgetStore, provider?: string): Budget[] {
  if (!provider) return store.budgets;
  return store.budgets.filter(b => b.provider === provider);
}

export function evaluateBudget(budget: Budget, entries: HistoryEntry[]): BudgetEvaluation {
  const windowStart = Date.now() - budget.windowDays * 86_400_000;
  const relevant = entries.filter(
    e => e.provider === budget.provider && new Date(e.startedAt).getTime() >= windowStart
  );

  const durations = relevant
    .filter(e => e.finishedAt)
    .map(e => new Date(e.finishedAt!).getTime() - new Date(e.startedAt).getTime());

  const actualDurationMs =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const failures = relevant.filter(e => e.status === 'failure' || e.status === 'error').length;
  const actualFailureRate = relevant.length > 0 ? failures / relevant.length : 0;

  const durationBreached = actualDurationMs > budget.maxDurationMs;
  const failureRateBreached = actualFailureRate > budget.maxFailureRate;

  return {
    budget,
    actualDurationMs,
    actualFailureRate,
    durationBreached,
    failureRateBreached,
    breached: durationBreached || failureRateBreached,
  };
}

export function evaluateAllBudgets(
  store: BudgetStore,
  entries: HistoryEntry[]
): BudgetEvaluation[] {
  return store.budgets.map(b => evaluateBudget(b, entries));
}
