import { computeBaseline, compareToBaseline, BaselineReport } from './baseline';
import { recordMetric, clearMetrics } from '../metrics/store';

function makeMetric(
  route: string,
  method: string,
  duration: number,
  status = 200
) {
  recordMetric({ route, method, duration, status, timestamp: Date.now() });
}

describe('computeBaseline', () => {
  beforeEach(() => clearMetrics());

  it('returns empty entries when no metrics exist', () => {
    const report = computeBaseline();
    expect(report.entries).toHaveLength(0);
    expect(report.generatedAt).toBeTruthy();
  });

  it('computes p50, p95, p99, mean for a route', () => {
    for (let i = 1; i <= 10; i++) makeMetric('/api/items', 'GET', i * 10);
    const report = computeBaseline();
    expect(report.entries).toHaveLength(1);
    const entry = report.entries[0];
    expect(entry.route).toBe('/api/items');
    expect(entry.method).toBe('GET');
    expect(entry.sampleCount).toBe(10);
    expect(entry.mean).toBe(55);
    expect(entry.p50).toBeGreaterThan(0);
    expect(entry.p95).toBeGreaterThanOrEqual(entry.p50);
    expect(entry.p99).toBeGreaterThanOrEqual(entry.p95);
  });

  it('handles multiple routes separately', () => {
    makeMetric('/api/items', 'GET', 100);
    makeMetric('/api/users', 'POST', 200);
    const report = computeBaseline();
    expect(report.entries).toHaveLength(2);
    const routes = report.entries.map((e) => e.route);
    expect(routes).toContain('/api/items');
    expect(routes).toContain('/api/users');
  });
});

describe('compareToBaseline', () => {
  const makeReport = (p50: number, p95: number): BaselineReport => ({
    generatedAt: new Date().toISOString(),
    entries: [
      {
        route: '/api/items',
        method: 'GET',
        sampleCount: 10,
        p50,
        p95,
        p99: p95 + 10,
        mean: (p50 + p95) / 2,
        capturedAt: new Date().toISOString(),
      },
    ],
  });

  it('returns positive deltas when current is slower', () => {
    const base = makeReport(100, 200);
    const current = makeReport(150, 300);
    const diff = compareToBaseline(base, current);
    expect(diff).toHaveLength(1);
    expect(diff[0].p50Delta).toBe(50);
    expect(diff[0].p95Delta).toBe(100);
  });

  it('returns negative deltas when current is faster', () => {
    const base = makeReport(200, 400);
    const current = makeReport(100, 200);
    const diff = compareToBaseline(base, current);
    expect(diff[0].p50Delta).toBe(-100);
    expect(diff[0].p95Delta).toBe(-200);
  });

  it('skips routes not present in baseline', () => {
    const base = makeReport(100, 200);
    const current: BaselineReport = {
      generatedAt: new Date().toISOString(),
      entries: [
        { route: '/api/other', method: 'GET', sampleCount: 5, p50: 50, p95: 100, p99: 110, mean: 75, capturedAt: '' },
      ],
    };
    const diff = compareToBaseline(base, current);
    expect(diff).toHaveLength(0);
  });
});
