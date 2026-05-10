import { computePercentileReport, formatPercentileReport } from './percentileReport';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

function makeMetric(route: string, method: string, duration: number): RouteMetric {
  return { route, method, duration, timestamp: Date.now(), statusCode: 200 };
}

describe('computePercentileReport', () => {
  beforeEach(() => clearMetrics());

  it('returns empty routes when no metrics', () => {
    const report = computePercentileReport();
    expect(report.routes).toHaveLength(0);
    expect(report.generatedAt).toBeTruthy();
  });

  it('computes percentiles for a single route', () => {
    const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    durations.forEach((d) => recordMetric(makeMetric('/api/test', 'GET', d)));

    const report = computePercentileReport();
    expect(report.routes).toHaveLength(1);

    const r = report.routes[0];
    expect(r.route).toBe('/api/test');
    expect(r.method).toBe('GET');
    expect(r.count).toBe(10);
    expect(r.min).toBe(10);
    expect(r.max).toBe(100);
    expect(r.p50).toBeGreaterThanOrEqual(50);
    expect(r.p99).toBeGreaterThanOrEqual(90);
  });

  it('groups by method and route separately', () => {
    recordMetric(makeMetric('/api/items', 'GET', 50));
    recordMetric(makeMetric('/api/items', 'POST', 200));

    const report = computePercentileReport();
    expect(report.routes).toHaveLength(2);

    const methods = report.routes.map((r) => r.method);
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
  });

  it('sorts routes by p95 descending', () => {
    [10, 12, 11].forEach((d) => recordMetric(makeMetric('/fast', 'GET', d)));
    [100, 200, 300].forEach((d) => recordMetric(makeMetric('/slow', 'GET', d)));

    const report = computePercentileReport();
    expect(report.routes[0].route).toBe('/slow');
  });
});

describe('formatPercentileReport', () => {
  beforeEach(() => clearMetrics());

  it('includes header and route info', () => {
    recordMetric(makeMetric('/api/x', 'GET', 42));
    const report = computePercentileReport();
    const text = formatPercentileReport(report);

    expect(text).toContain('Percentile Report');
    expect(text).toContain('/api/x');
    expect(text).toContain('GET');
    expect(text).toContain('p50');
  });

  it('shows no data message when empty', () => {
    const report = computePercentileReport();
    const text = formatPercentileReport(report);
    expect(text).toContain('No data available.');
  });
});
