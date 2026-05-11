import { computeTopRoutes, formatTopRoutesReport } from './topRoutes';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types/index';

function makeMetric(route: string, method: string, duration: number): RouteMetric {
  return { route, method, duration, timestamp: Date.now(), statusCode: 200 };
}

describe('computeTopRoutes', () => {
  beforeEach(() => clearMetrics());

  it('returns empty array when no metrics', () => {
    expect(computeTopRoutes()).toEqual([]);
  });

  it('aggregates metrics per route+method', () => {
    recordMetric(makeMetric('/api/users', 'GET', 100));
    recordMetric(makeMetric('/api/users', 'GET', 200));
    recordMetric(makeMetric('/api/orders', 'GET', 50));

    const results = computeTopRoutes({ sortBy: 'avgDuration' });
    expect(results).toHaveLength(2);
    expect(results[0].route).toBe('/api/users');
    expect(results[0].avgDuration).toBe(150);
    expect(results[0].callCount).toBe(2);
  });

  it('sorts by maxDuration', () => {
    recordMetric(makeMetric('/slow', 'GET', 500));
    recordMetric(makeMetric('/fast', 'GET', 10));
    recordMetric(makeMetric('/fast', 'GET', 20));

    const results = computeTopRoutes({ sortBy: 'maxDuration' });
    expect(results[0].route).toBe('/slow');
    expect(results[0].maxDuration).toBe(500);
  });

  it('sorts by callCount', () => {
    recordMetric(makeMetric('/popular', 'POST', 30));
    recordMetric(makeMetric('/popular', 'POST', 40));
    recordMetric(makeMetric('/popular', 'POST', 50));
    recordMetric(makeMetric('/rare', 'POST', 999));

    const results = computeTopRoutes({ sortBy: 'callCount' });
    expect(results[0].route).toBe('/popular');
    expect(results[0].callCount).toBe(3);
  });

  it('respects limit option', () => {
    for (let i = 0; i < 5; i++) {
      recordMetric(makeMetric(`/route${i}`, 'GET', (i + 1) * 100));
    }
    const results = computeTopRoutes({ limit: 3 });
    expect(results).toHaveLength(3);
  });

  it('filters by method', () => {
    recordMetric(makeMetric('/api/data', 'GET', 100));
    recordMetric(makeMetric('/api/data', 'POST', 200));

    const results = computeTopRoutes({ method: 'POST' });
    expect(results).toHaveLength(1);
    expect(results[0].method).toBe('POST');
  });

  it('is case-insensitive for method filter', () => {
    recordMetric(makeMetric('/api/data', 'GET', 100));
    const results = computeTopRoutes({ method: 'get' });
    expect(results).toHaveLength(1);
  });
});

describe('formatTopRoutesReport', () => {
  it('returns fallback message for empty entries', () => {
    expect(formatTopRoutesReport([])).toBe('No route data available.');
  });

  it('formats entries correctly', () => {
    const entry = {
      route: '/api/users',
      method: 'GET',
      avgDuration: 123.456,
      maxDuration: 200.0,
      callCount: 5,
      totalDuration: 617.28,
    };
    const report = formatTopRoutesReport([entry]);
    expect(report).toContain('GET /api/users');
    expect(report).toContain('avg: 123.46ms');
    expect(report).toContain('max: 200.00ms');
    expect(report).toContain('calls: 5');
  });
});
