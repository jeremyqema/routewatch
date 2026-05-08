import { MetricsStore, RouteMetrics } from '../types';

const store: MetricsStore = {};

const MAX_ENTRIES_PER_ROUTE = 100;

export function recordMetric(metric: RouteMetrics): void {
  const key = `${metric.method}:${metric.route}`;

  if (!store[key]) {
    store[key] = [];
  }

  store[key].push(metric);

  if (store[key].length > MAX_ENTRIES_PER_ROUTE) {
    store[key].shift();
  }
}

export function getMetrics(method?: string, route?: string): RouteMetrics[] {
  if (method && route) {
    const key = `${method.toUpperCase()}:${route}`;
    return store[key] ?? [];
  }

  return Object.values(store).flat();
}

export function clearMetrics(): void {
  Object.keys(store).forEach((key) => delete store[key]);
}

export function getRouteKeys(): string[] {
  return Object.keys(store);
}

/**
 * Returns summary statistics for a specific route, or all routes if no
 * method/route is provided.
 */
export function getMetricsSummary(
  method?: string,
  route?: string
): { count: number; avgDuration: number; errorRate: number } {
  const metrics = getMetrics(method, route);

  if (metrics.length === 0) {
    return { count: 0, avgDuration: 0, errorRate: 0 };
  }

  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
  const errorCount = metrics.filter((m) => m.statusCode >= 500).length;

  return {
    count: metrics.length,
    avgDuration: totalDuration / metrics.length,
    errorRate: errorCount / metrics.length,
  };
}
