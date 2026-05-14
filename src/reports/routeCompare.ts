import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

export interface RouteComparisonEntry {
  route: string;
  method: string;
  avgDuration: number;
  p95Duration: number;
  requestCount: number;
  errorRate: number;
}

export interface RouteComparisonReport {
  routes: RouteComparisonEntry[];
  generatedAt: string;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function buildEntry(route: string, method: string, metrics: RouteMetric[]): RouteComparisonEntry {
  const durations = metrics.map((m) => m.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const errors = metrics.filter((m) => m.status >= 400).length;
  return {
    route,
    method,
    avgDuration: Math.round(avg * 100) / 100,
    p95Duration: percentile(durations, 95),
    requestCount: metrics.length,
    errorRate: Math.round((errors / metrics.length) * 10000) / 100,
  };
}

export function computeRouteComparison(routes: string[]): RouteComparisonReport {
  const all = getMetrics();
  const entries: RouteComparisonEntry[] = [];

  for (const routeKey of routes) {
    const [method, route] = routeKey.includes(' ')
      ? routeKey.split(' ')
      : ['GET', routeKey];

    const filtered = all.filter(
      (m) => m.route === route && m.method.toUpperCase() === method.toUpperCase()
    );

    if (filtered.length > 0) {
      entries.push(buildEntry(route, method.toUpperCase(), filtered));
    }
  }

  return {
    routes: entries,
    generatedAt: new Date().toISOString(),
  };
}
