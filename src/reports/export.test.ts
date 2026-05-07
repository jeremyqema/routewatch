import { exportMetrics } from './export';
import { recordMetric, clearMetrics } from '../metrics/store';

beforeEach(() => {
  clearMetrics();
});

describe('exportMetrics – JSON format', () => {
  it('returns an empty array when no metrics recorded', () => {
    const result = exportMetrics({ format: 'json' });
    expect(JSON.parse(result)).toEqual([]);
  });

  it('includes summary fields for recorded routes', () => {
    recordMetric('GET', '/api/users', 120);
    recordMetric('GET', '/api/users', 80);
    recordMetric('POST', '/api/users', 200);

    const result = JSON.parse(exportMetrics({ format: 'json' }));

    expect(result).toHaveLength(2);
    const getRoute = result.find((r: { route: string }) => r.route === 'GET /api/users');
    expect(getRoute).toBeDefined();
    expect(getRoute.count).toBe(2);
    expect(getRoute.avg).toBe(100);
    expect(getRoute.min).toBe(80);
    expect(getRoute.max).toBe(120);
  });

  it('filters by provided route keys', () => {
    recordMetric('GET', '/api/users', 100);
    recordMetric('DELETE', '/api/users', 50);

    const result = JSON.parse(
      exportMetrics({ format: 'json', routes: ['GET /api/users'] })
    );

    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('GET /api/users');
  });
});

describe('exportMetrics – CSV format', () => {
  it('returns an empty string when no metrics recorded', () => {
    const result = exportMetrics({ format: 'csv' });
    expect(result).toBe('');
  });

  it('returns CSV with header and data rows', () => {
    recordMetric('GET', '/health', 30);

    const result = exportMetrics({ format: 'csv' });
    const lines = result.split('\n');

    expect(lines[0]).toContain('route');
    expect(lines[0]).toContain('count');
    expect(lines[1]).toContain('GET /health');
  });

  it('defaults to json when format is omitted', () => {
    recordMetric('GET', '/ping', 10);
    const result = exportMetrics();
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
