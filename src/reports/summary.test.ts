import { computeRouteSummary, generateSummaryReport, formatSummaryReport } from './summary';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

const makeMetric = (duration: number): RouteMetric => ({
  route: 'GET /api/test',
  method: 'GET',
  statusCode: 200,
  duration,
  timestamp: new Date().toISOString(),
});

describe('computeRouteSummary', () => {
  it('returns zeros for empty metrics array', () => {
    const result = computeRouteSummary('GET /empty', []);
    expect(result.count).toBe(0);
    expect(result.avgDuration).toBe(0);
  });

  it('computes correct stats for a single metric', () => {
    const result = computeRouteSummary('GET /api/test', [makeMetric(100)]);
    expect(result.count).toBe(1);
    expect(result.avgDuration).toBe(100);
    expect(result.minDuration).toBe(100);
    expect(result.maxDuration).toBe(100);
    expect(result.p95Duration).toBe(100);
  });

  it('computes correct avg, min, max, p95 for multiple metrics', () => {
    const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const metrics = durations.map(makeMetric);
    const result = computeRouteSummary('GET /api/test', metrics);
    expect(result.count).toBe(10);
    expect(result.avgDuration).toBe(55);
    expect(result.minDuration).toBe(10);
    expect(result.maxDuration).toBe(100);
    expect(result.p95Duration).toBe(100);
  });
});

describe('generateSummaryReport', () => {
  beforeEach(() => clearMetrics());

  it('returns empty report when no metrics recorded', () => {
    const report = generateSummaryReport();
    expect(report.totalRequests).toBe(0);
    expect(report.totalRoutes).toBe(0);
    expect(report.slowestRoute).toBeNull();
    expect(report.routes).toHaveLength(0);
  });

  it('includes recorded metrics in report', () => {
    recordMetric({ route: 'GET /api/users', method: 'GET', statusCode: 200, duration: 150, timestamp: new Date().toISOString() });
    recordMetric({ route: 'GET /api/users', method: 'GET', statusCode: 200, duration: 250, timestamp: new Date().toISOString() });
    const report = generateSummaryReport();
    expect(report.totalRequests).toBe(2);
    expect(report.totalRoutes).toBe(1);
    expect(report.slowestRoute?.route).toBe('GET /api/users');
    expect(report.slowestRoute?.avgDuration).toBe(200);
  });
});

describe('formatSummaryReport', () => {
  it('produces a non-empty string containing route info', () => {
    clearMetrics();
    recordMetric({ route: 'POST /api/items', method: 'POST', statusCode: 201, duration: 80, timestamp: new Date().toISOString() });
    const report = generateSummaryReport();
    const output = formatSummaryReport(report);
    expect(output).toContain('RouteWatch Summary Report');
    expect(output).toContain('POST /api/items');
    expect(output).toContain('avg: 80ms');
  });
});
