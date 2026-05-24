import { buildForecast, Forecast } from './forecast';
import { HistoryEntry } from './history';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'e1',
    provider: 'github',
    repo: 'org/repo',
    branch: 'main',
    status: 'success',
    startedAt: Date.now() - 60_000,
    finishedAt: Date.now(),
    duration: 60_000,
    tags: [],
    ...overrides,
  };
}

describe('buildForecast', () => {
  it('returns the correct number of forecast points', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `e${i}`, duration: 50_000 + i * 1_000, status: 'success' })
    );
    const forecast = buildForecast(entries, 6 * 60 * 60 * 1000, 6);
    expect(forecast.points).toHaveLength(6);
  });

  it('timestamps are strictly increasing', () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `e${i}` }));
    const forecast = buildForecast(entries);
    for (let i = 1; i < forecast.points.length; i++) {
      expect(forecast.points[i].timestamp).toBeGreaterThan(forecast.points[i - 1].timestamp);
    }
  });

  it('confidence decreases over the horizon', () => {
    const entries = Array.from({ length: 8 }, (_, i) => makeEntry({ id: `e${i}` }));
    const forecast = buildForecast(entries);
    const confidences = forecast.points.map(p => p.confidence);
    for (let i = 1; i < confidences.length; i++) {
      expect(confidences[i]).toBeLessThanOrEqual(confidences[i - 1]);
    }
  });

  it('clamps predictedSuccessRate between 0 and 1', () => {
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ id: `e${i}`, status: i % 2 === 0 ? 'success' : 'failure' })
    );
    const forecast = buildForecast(entries);
    forecast.points.forEach(p => {
      expect(p.predictedSuccessRate).toBeGreaterThanOrEqual(0);
      expect(p.predictedSuccessRate).toBeLessThanOrEqual(1);
    });
  });

  it('handles fewer than 2 data points gracefully', () => {
    const entries = [makeEntry()];
    const forecast = buildForecast(entries);
    expect(forecast.points.length).toBeGreaterThan(0);
    forecast.points.forEach(p => expect(p.predictedDuration).toBeGreaterThanOrEqual(0));
  });

  it('sets generatedAt close to now', () => {
    const before = Date.now();
    const forecast = buildForecast([makeEntry()]);
    expect(forecast.generatedAt).toBeGreaterThanOrEqual(before);
    expect(forecast.generatedAt).toBeLessThanOrEqual(Date.now() + 5);
  });
});
