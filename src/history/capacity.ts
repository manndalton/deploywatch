/**
 * Capacity planning: tracks resource usage trends and projects when
 * deployment slots / concurrency limits will be exhausted.
 */

export interface CapacityPoint {
  timestamp: Date;
  used: number;
  limit: number;
}

export interface CapacityForecast {
  currentUsageRate: number;  // 0-1
  projectedExhaustionDate: Date | null;
  trend: 'growing' | 'stable' | 'shrinking';
  points: CapacityPoint[];
}

export interface CapacityStore {
  limit: number;
  points: CapacityPoint[];
}

export function emptyCapacityStore(limit = 100): CapacityStore {
  return { limit, points: [] };
}

export function addCapacityPoint(
  store: CapacityStore,
  used: number,
  timestamp = new Date()
): CapacityStore {
  const point: CapacityPoint = { timestamp, used, limit: store.limit };
  return { ...store, points: [...store.points, point] };
}

export function pruneCapacityPoints(
  store: CapacityStore,
  maxAge: number
): CapacityStore {
  const cutoff = Date.now() - maxAge;
  return {
    ...store,
    points: store.points.filter(p => p.timestamp.getTime() >= cutoff),
  };
}

export function buildCapacityForecast(store: CapacityStore): CapacityForecast {
  const { points, limit } = store;
  if (points.length === 0) {
    return { currentUsageRate: 0, projectedExhaustionDate: null, trend: 'stable', points: [] };
  }

  const latest = points[points.length - 1];
  const currentUsageRate = latest.used / limit;

  if (points.length < 2) {
    return { currentUsageRate, projectedExhaustionDate: null, trend: 'stable', points };
  }

  const first = points[0];
  const durationMs = latest.timestamp.getTime() - first.timestamp.getTime();
  const usageDelta = latest.used - first.used;

  let trend: CapacityForecast['trend'] = 'stable';
  if (usageDelta > limit * 0.05) trend = 'growing';
  else if (usageDelta < -(limit * 0.05)) trend = 'shrinking';

  let projectedExhaustionDate: Date | null = null;
  if (trend === 'growing' && durationMs > 0) {
    const ratePerMs = usageDelta / durationMs;
    const remaining = limit - latest.used;
    if (ratePerMs > 0) {
      const msUntilExhaustion = remaining / ratePerMs;
      projectedExhaustionDate = new Date(latest.timestamp.getTime() + msUntilExhaustion);
    }
  }

  return { currentUsageRate, projectedExhaustionDate, trend, points };
}
