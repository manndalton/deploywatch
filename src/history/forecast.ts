import { HistoryEntry } from './history';
import { buildMetricPoints } from './metrics';

export interface ForecastPoint {
  timestamp: number;
  predictedDuration: number;
  predictedSuccessRate: number;
  confidence: number;
}

export interface Forecast {
  generatedAt: number;
  horizon: number; // ms into the future
  points: ForecastPoint[];
}

/** Simple linear regression over [x, y] pairs. Returns [slope, intercept]. */
function linearRegression(pairs: [number, number][]): [number, number] {
  const n = pairs.length;
  if (n < 2) return [0, pairs[0]?.[1] ?? 0];
  const sumX = pairs.reduce((s, [x]) => s + x, 0);
  const sumY = pairs.reduce((s, [, y]) => s + y, 0);
  const sumXY = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return [0, sumY / n];
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return [slope, intercept];
}

/** Confidence decreases as the forecast extends further from the last data point. */
function computeConfidence(stepIndex: number, totalSteps: number): number {
  return Math.max(0.1, 1 - (stepIndex / totalSteps) * 0.9);
}

export function buildForecast(
  entries: HistoryEntry[],
  horizon = 6 * 60 * 60 * 1000, // 6 hours
  steps = 6
): Forecast {
  const now = Date.now();
  const points = buildMetricPoints(entries);

  const durPairs: [number, number][] = points.map((p, i) => [i, p.avgDuration]);
  const ratePairs: [number, number][] = points.map((p, i) => [i, p.successRate]);

  const [durSlope, durIntercept] = linearRegression(durPairs);
  const [rateSlope, rateIntercept] = linearRegression(ratePairs);

  const stepSize = horizon / steps;
  const forecastPoints: ForecastPoint[] = Array.from({ length: steps }, (_, i) => {
    const xNext = points.length + i;
    return {
      timestamp: now + stepSize * (i + 1),
      predictedDuration: Math.max(0, durSlope * xNext + durIntercept),
      predictedSuccessRate: Math.min(1, Math.max(0, rateSlope * xNext + rateIntercept)),
      confidence: computeConfidence(i, steps),
    };
  });

  return { generatedAt: now, horizon, points: forecastPoints };
}
