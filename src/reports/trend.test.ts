import { computeTrendReport } from './trend';
import { recordMetric, clearMetrics } from '../metrics/store';

function makeMetric(
  route: string,
  method: string,
  duration: number,
  timestamp: number
) {
  recordMetric({ route, method, duration, statusCode: 200, timestamp });
}

describe('computeTrendReport', () => {
  beforeEach(() => {
    clearMetrics();
  });

  const now = Date.now();
  const windowMs = 5 * 60 * 1000;

  it('returns empty routes when no metrics exist', () => {
    const report = computeTrendReport(windowMs);
    expect(report.routes).toHaveLength(0);
    expect(report.windowMs).toBe(windowMs);
    expect(report.generatedAt).toBeTruthy();
  });

  it('includes only routes with recent metrics', () => {
    makeMetric('/api/old', 'GET', 100, now - windowMs * 3);
    makeMetric('/api/recent', 'GET', 100, now - 1000);
    const report = computeTrendReport(windowMs);
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].route).toBe('/api/recent');
  });

  it('marks a route as degrading when recent avg is much higher than older avg', () => {
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/slow', 'GET', 50, now - windowMs * 1.5);
    }
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/slow', 'GET', 200, now - 1000);
    }
    const report = computeTrendReport(windowMs);
    const entry = report.routes.find((r) => r.route === '/api/slow');
    expect(entry).toBeDefined();
    expect(entry!.trend).toBe('degrading');
    expect(entry!.changePercent).toBeGreaterThan(10);
  });

  it('marks a route as improving when recent avg is much lower than older avg', () => {
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/fast', 'GET', 300, now - windowMs * 1.5);
    }
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/fast', 'GET', 50, now - 1000);
    }
    const report = computeTrendReport(windowMs);
    const entry = report.routes.find((r) => r.route === '/api/fast');
    expect(entry).toBeDefined();
    expect(entry!.trend).toBe('improving');
    expect(entry!.changePercent).toBeLessThan(-10);
  });

  it('marks a route as stable when change is within threshold', () => {
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/stable', 'GET', 100, now - windowMs * 1.5);
    }
    for (let i = 0; i < 5; i++) {
      makeMetric('/api/stable', 'GET', 105, now - 1000);
    }
    const report = computeTrendReport(windowMs);
    const entry = report.routes.find((r) => r.route === '/api/stable');
    expect(entry).toBeDefined();
    expect(entry!.trend).toBe('stable');
  });

  it('computes p95 and requestCount correctly', () => {
    const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 200];
    durations.forEach((d) => makeMetric('/api/p95', 'POST', d, now - 1000));
    const report = computeTrendReport(windowMs);
    const entry = report.routes.find((r) => r.route === '/api/p95');
    expect(entry).toBeDefined();
    expect(entry!.requestCount).toBe(10);
    expect(entry!.p95Duration).toBeGreaterThanOrEqual(180);
  });
});
