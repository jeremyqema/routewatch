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
