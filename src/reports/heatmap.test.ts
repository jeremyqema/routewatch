import { buildHeatmap, computeHeatmapReport, HeatmapCell } from './heatmap';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

function makeMetric(
  route: string,
  duration: number,
  timestamp: number
): RouteMetric {
  return { route, method: 'GET', statusCode: 200, duration, timestamp };
}

describe('buildHeatmap', () => {
  it('returns empty array for no metrics', () => {
    expect(buildHeatmap([])).toEqual([]);
  });

  it('groups metrics into correct day/hour buckets', () => {
    // 2024-01-01 10:00 UTC = Monday (day 1), hour 10
    const ts1 = new Date('2024-01-01T10:00:00Z').getTime();
    // 2024-01-01 10:30 UTC = same bucket
    const ts2 = new Date('2024-01-01T10:30:00Z').getTime();
    // 2024-01-02 15:00 UTC = Tuesday (day 2), hour 15
    const ts3 = new Date('2024-01-02T15:00:00Z').getTime();

    const metrics: RouteMetric[] = [
      makeMetric('/api/test', 100, ts1),
      makeMetric('/api/test', 200, ts2),
      makeMetric('/api/test', 300, ts3),
    ];

    const cells = buildHeatmap(metrics);
    expect(cells).toHaveLength(2);

    const mondayBucket = cells.find((c) => c.day === 1 && c.hour === 10);
    expect(mondayBucket).toBeDefined();
    expect(mondayBucket!.count).toBe(2);
    expect(mondayBucket!.avgDuration).toBe(150);

    const tuesdayBucket = cells.find((c) => c.day === 2 && c.hour === 15);
    expect(tuesdayBucket).toBeDefined();
    expect(tuesdayBucket!.count).toBe(1);
    expect(tuesdayBucket!.avgDuration).toBe(300);
  });
});

describe('computeHeatmapReport', () => {
  beforeEach(() => clearMetrics());

  it('returns empty cells and defaults when no data exists for route', () => {
    const report = computeHeatmapReport('/missing');
    expect(report.route).toBe('/missing');
    expect(report.cells).toEqual([]);
  });

  it('identifies peak day and hour correctly', () => {
    const ts1 = new Date('2024-01-01T08:00:00Z').getTime(); // Mon, 8
    const ts2 = new Date('2024-01-01T08:30:00Z').getTime(); // Mon, 8
    const ts3 = new Date('2024-01-03T20:00:00Z').getTime(); // Wed, 20

    recordMetric(makeMetric('/api/data', 50, ts1));
    recordMetric(makeMetric('/api/data', 60, ts2));
    recordMetric(makeMetric('/api/data', 70, ts3));

    const report = computeHeatmapReport('/api/data');
    expect(report.peakDay).toBe(1);
    expect(report.peakHour).toBe(8);
    expect(report.cells).toHaveLength(2);
  });
});
