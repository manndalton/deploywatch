import { HistoryEntry } from './history';
import { MetricPoints } from './metrics';

export interface AnomalyResult {
  entryId: string;
  field: 'duration' | 'successRate';
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

export function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function severityFromZScore(z: number): 'low' | 'medium' | 'high' {
  const abs = Math.abs(z);
  if (abs >= 3) return 'high';
  if (abs >= 2) return 'medium';
  return 'low';
}

export function detectAnomalies(
  entries: HistoryEntry[],
  threshold = 2.0
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  const durations = entries
    .map(e => e.duration ?? 0)
    .filter(d => d > 0);

  const mean = computeMean(durations);
  const stdDev = computeStdDev(durations, mean);

  for (const entry of entries) {
    const d = entry.duration ?? 0;
    if (d <= 0) continue;
    const z = zScore(d, mean, stdDev);
    if (Math.abs(z) >= threshold) {
      results.push({
        entryId: entry.id,
        field: 'duration',
        value: d,
        mean,
        stdDev,
        zScore: z,
        severity: severityFromZScore(z),
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
