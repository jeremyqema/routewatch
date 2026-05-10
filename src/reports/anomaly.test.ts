import { detectAnomalies, stdDev } from './anomaly';
import { RouteMetric } from '../types';

function makeMetric(
  route: string,
  method: string,
  duration: number,
  timestamp = Date.now()
): RouteMetric {
  return { route, method, duration, timestamp, statusCode: 200 };
}

describe('stdDev', () => {
  it('returns 0 for empty array', () => {
    expect(stdDev([])).toBe(0);
  });

  it('returns 0 for identical values', () => {
    expect(stdDev([5, 5, 5, 5])).toBe(0);
  });

  it('computes correct standard deviation', () => {
    const result = stdDev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2, 1);
  });
});

describe('detectAnomalies', () => {
  it('returns empty anomalies for empty metrics', () => {
    const report = detectAnomalies([]);
    expect(report.anomalies).toHaveLength(0);
  });

  it('skips routes with fewer than 5 samples', () => {
    const metrics = [
      makeMetric('/api/test', 'GET', 100),
      makeMetric('/api/test', 'GET', 5000),
    ];
    const report = detectAnomalies(metrics);
    expect(report.anomalies).toHaveLength(0);
  });

  it('detects a high-duration anomaly', () => {
    const base = [100, 110, 105, 95, 102, 108, 99, 103];
    const metrics: RouteMetric[] = [
      ...base.map(d => makeMetric('/api/items', 'GET', d)),
      makeMetric('/api/items', 'GET', 2000),
    ];
    const report = detectAnomalies(metrics, 2.0);
    expect(report.anomalies.length).toBeGreaterThan(0);
    const anomaly = report.anomalies[0];
    expect(anomaly.route).toBe('/api/items');
    expect(anomaly.duration).toBe(2000);
    expect(anomaly.zScore).toBeGreaterThan(2.0);
  });

  it('assigns correct severity levels', () => {
    const base = Array.from({ length: 10 }, () => makeMetric('/api/x', 'POST', 100));
    const highOutlier = makeMetric('/api/x', 'POST', 9999);
    const report = detectAnomalies([...base, highOutlier], 2.0);
    const found = report.anomalies.find(a => a.duration === 9999);
    expect(found).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(found!.severity);
  });

  it('sorts anomalies by absolute z-score descending', () => {
    const base = Array.from({ length: 8 }, () => makeMetric('/api/y', 'GET', 200));
    const metrics = [
      ...base,
      makeMetric('/api/y', 'GET', 5000),
      makeMetric('/api/y', 'GET', 3000),
    ];
    const report = detectAnomalies(metrics, 1.5);
    for (let i = 1; i < report.anomalies.length; i++) {
      expect(Math.abs(report.anomalies[i - 1].zScore)).toBeGreaterThanOrEqual(
        Math.abs(report.anomalies[i].zScore)
      );
    }
  });

  it('includes generatedAt timestamp', () => {
    const before = Date.now();
    const report = detectAnomalies([]);
    expect(report.generatedAt).toBeGreaterThanOrEqual(before);
  });
});
