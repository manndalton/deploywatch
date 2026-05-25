import { HistoryEntry } from './history';
import { computeSuccessRate, computeAverageDuration } from './metrics';
import { detectAnomalies } from './anomaly';

export interface HealthScore {
  key: string;
  score: number;        // 0–100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  successRate: number;  // 0–1
  avgDurationMs: number;
  anomalyCount: number;
  sampleSize: number;
}

export function gradeFromScore(score: number): HealthScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function computeHealthScore(
  key: string,
  entries: HistoryEntry[]
): HealthScore {
  if (entries.length === 0) {
    return { key, score: 0, grade: 'F', successRate: 0, avgDurationMs: 0, anomalyCount: 0, sampleSize: 0 };
  }

  const successRate = computeSuccessRate(entries);
  const avgDurationMs = computeAverageDuration(entries);
  const anomalies = detectAnomalies(entries);
  const anomalyCount = anomalies.length;

  // Weighted score: 60% success rate, 20% anomaly penalty, 20% size bonus
  const successComponent = successRate * 60;
  const anomalyPenalty = Math.min(anomalyCount * 5, 20);
  const sizeBonus = Math.min(entries.length / 10, 1) * 20;

  const score = Math.max(0, Math.min(100, successComponent - anomalyPenalty + sizeBonus));
  const grade = gradeFromScore(score);

  return { key, score: Math.round(score), grade, successRate, avgDurationMs, anomalyCount, sampleSize: entries.length };
}

export function computeAllHealthScores(
  entries: HistoryEntry[]
): HealthScore[] {
  const grouped = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const k = `${e.provider}/${e.name}`;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }
  return Array.from(grouped.entries())
    .map(([key, group]) => computeHealthScore(key, group))
    .sort((a, b) => a.score - b.score);
}
