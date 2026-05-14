import { clearMetrics, recordMetric } from '../metrics/store';
import { computeRouteComparison } from './routeCompare';
import { RouteMetric } from '../types';

function makeMetric(
  route: string,
  method: string,
  duration: number,
  status = 200
): RouteMetric {
  return { route, method, duration, status, timestamp: Date.now() };
}

describe('computeRouteComparison', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('returns comparison entries for specified routes', () => {
    recordMetric(makeMetric('/api/users', 'GET', 100));
    recordMetric(makeMetric('/api/users', 'GET', 200));
    recordMetric(makeMetric('/api/posts', 'GET', 50));

    const report = computeRouteComparison(['GET /api/users', 'GET /api/posts']);
    expect(report.routes).toHaveLength(2);
    const users = report.routes.find((r) => r.route === '/api/users');
    expect(users).toBeDefined();
    expect(users!.avgDuration).toBe(150);
    expect(users!.requestCount).toBe(2);
  });

  it('excludes routes with no recorded metrics', () => {
    recordMetric(makeMetric('/api/users', 'GET', 100));

    const report = computeRouteComparison(['GET /api/users', 'GET /api/missing']);
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].route).toBe('/api/users');
  });

  it('calculates error rate correctly', () => {
    recordMetric(makeMetric('/api/users', 'GET', 100, 200));
    recordMetric(makeMetric('/api/users', 'GET', 120, 500));
    recordMetric(makeMetric('/api/users', 'GET', 90, 404));

    const report = computeRouteComparison(['GET /api/users']);
    const entry = report.routes[0];
    expect(entry.errorRate).toBeCloseTo(66.67, 1);
  });

  it('handles route key without method prefix (defaults to GET)', () => {
    recordMetric(makeMetric('/api/users', 'GET', 150));

    const report = computeRouteComparison(['/api/users']);
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].method).toBe('GET');
  });

  it('includes generatedAt timestamp in report', () => {
    const report = computeRouteComparison([]);
    expect(report.generatedAt).toBeDefined();
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });

  it('returns empty routes array when no routes specified', () => {
    recordMetric(makeMetric('/api/users', 'GET', 100));
    const report = computeRouteComparison([]);
    expect(report.routes).toEqual([]);
  });
});
