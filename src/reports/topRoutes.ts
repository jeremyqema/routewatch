import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types/index';

export interface TopRouteEntry {
  route: string;
  method: string;
  avgDuration: number;
  maxDuration: number;
  callCount: number;
  totalDuration: number;
}

export type TopRoutesSortBy = 'avgDuration' | 'maxDuration' | 'callCount' | 'totalDuration';

export interface TopRoutesOptions {
  limit?: number;
  sortBy?: TopRoutesSortBy;
  method?: string;
}

export function computeTopRoutes(options: TopRoutesOptions = {}): TopRouteEntry[] {
  const { limit = 10, sortBy = 'avgDuration', method } = options;
  const metrics = getMetrics();

  const grouped = new Map<string, RouteMetric[]>();

  for (const metric of metrics) {
    if (method && metric.method.toUpperCase() !== method.toUpperCase()) continue;
    const key = `${metric.method.toUpperCase()} ${metric.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(metric);
  }

  const entries: TopRouteEntry[] = [];

  for (const [key, group] of grouped.entries()) {
    const [routeMethod, ...routeParts] = key.split(' ');
    const route = routeParts.join(' ');
    const durations = group.map((m) => m.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    entries.push({
      route,
      method: routeMethod,
      avgDuration: totalDuration / durations.length,
      maxDuration: Math.max(...durations),
      callCount: durations.length,
      totalDuration,
    });
  }

  entries.sort((a, b) => b[sortBy] - a[sortBy]);

  return entries.slice(0, limit);
}

export function formatTopRoutesReport(entries: TopRouteEntry[]): string {
  if (entries.length === 0) return 'No route data available.';
  const lines = entries.map(
    (e, i) =>
      `${i + 1}. ${e.method} ${e.route} — avg: ${e.avgDuration.toFixed(2)}ms, max: ${e.maxDuration.toFixed(2)}ms, calls: ${e.callCount}`
  );
  return `Top Routes:\n${lines.join('\n')}`;
}
