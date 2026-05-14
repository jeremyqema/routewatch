import { computeSlowRoutes, formatSlowRoutesReport } from './slowRoutes';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types/index';

function makeMetric(route: string, method: string, duration: number): RouteMetric {
  return { route, method, duration, statusCode: 200, timestamp: Date.now() };
}

describe('computeSlowRoutes', () => {
  beforeEach(() => clearMetrics());

  it('returns empty routes when no metrics exist', () => {
    const report = computeSlowRoutes(500);
    expect(report.routes).toHaveLength(0);
    expect(report.threshold).toBe(500);
  });

  it('excludes routes with no slow calls', () => {
    recordMetric(makeMetric('/fast', 'GET', 100));
    recordMetric(makeMetric('/fast', 'GET', 200));
    const report = computeSlowRoutes(500);
    expect(report.routes).toHaveLength(0);
  });

  it('includes routes that exceed the threshold', () => {
    recordMetric(makeMetric('/api/users', 'GET', 600));
    recordMetric(makeMetric('/api/users', 'GET', 200));
    const report = computeSlowRoutes(500);
    expect(report.routes).toHaveLength(1);
    const entry = report.routes[0];
    expect(entry.route).toBe('/api/users');
    expect(entry.method).toBe('GET');
    expect(entry.slowCallCount).toBe(1);
    expect(entry.callCount).toBe(2);
    expect(entry.slowCallPercent).toBe(50);
  });

  it('respects topN limit', () => {
    for (let i = 0; i < 5; i++) {
      recordMetric(makeMetric(`/route${i}`, 'GET', 1000));
    }
    const report = computeSlowRoutes(500, 3);
    expect(report.routes).toHaveLength(3);
  });

  it('sorts by slowCallPercent descending', () => {
    recordMetric(makeMetric('/a', 'GET', 600));
    recordMetric(makeMetric('/a', 'GET', 600));
    recordMetric(makeMetric('/b', 'GET', 600));
    recordMetric(makeMetric('/b', 'GET', 100));
    const report = computeSlowRoutes(500);
    expect(report.routes[0].route).toBe('/a');
    expect(report.routes[0].slowCallPercent).toBe(100);
    expect(report.routes[1].route).toBe('/b');
    expect(report.routes[1].slowCallPercent).toBe(50);
  });

  it('computes avgDuration and maxDuration correctly', () => {
    recordMetric(makeMetric('/api/data', 'POST', 800));
    recordMetric(makeMetric('/api/data', 'POST', 1200));
    const report = computeSlowRoutes(500);
    expect(report.routes[0].avgDuration).toBe(1000);
    expect(report.routes[0].maxDuration).toBe(1200);
  });
});

describe('formatSlowRoutesReport', () => {
  beforeEach(() => clearMetrics());

  it('shows no slow routes message when empty', () => {
    const report = computeSlowRoutes(500);
    const text = formatSlowRoutesReport(report);
    expect(text).toContain('No slow routes detected.');
  });

  it('includes route details in text output', () => {
    recordMetric(makeMetric('/api/items', 'GET', 700));
    const report = computeSlowRoutes(500);
    const text = formatSlowRoutesReport(report);
    expect(text).toContain('[GET] /api/items');
    expect(text).toContain('700ms');
  });
});
