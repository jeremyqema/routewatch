import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

export interface RouteTrend {
  route: string;
  method: string;
  windowMs: number;
  avgDuration: number;
  requestCount: number;
  p95Duration: number;
  trend: 'improving' | 'degrading' | 'stable';
  changePercent: number;
}

export interface TrendReport {
  generatedAt: string;
  windowMs: number;
  routes: RouteTrend[];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeTrendForRoute(
  recent: RouteMetric[],
  older: RouteMetric[],
  route: string,
  method: string,
  windowMs: number
): RouteTrend {
  const recentDurations = recent.map((m) => m.duration).sort((a, b) => a - b);
  const olderDurations = older.map((m) => m.duration).sort((a, b) => a - b);

  const recentAvg =
    recentDurations.length > 0
      ? recentDurations.reduce((s, d) => s + d, 0) / recentDurations.length
      : 0;

  const olderAvg =
    olderDurations.length > 0
      ? olderDurations.reduce((s, d) => s + d, 0) / olderDurations.length
      : recentAvg;

  const changePercent =
    olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  const trend: RouteTrend['trend'] =
    changePercent > 10 ? 'degrading' : changePercent < -10 ? 'improving' : 'stable';

  return {
    route,
    method,
    windowMs,
    avgDuration: Math.round(recentAvg),
    requestCount: recent.length,
    p95Duration: Math.round(percentile(recentDurations, 95)),
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

export function computeTrendReport(windowMs = 5 * 60 * 1000): TrendReport {
  const allMetrics = getMetrics();
  const now = Date.now();
  const windowStart = now - windowMs;
  const prevWindowStart = windowStart - windowMs;

  const grouped = new Map<string, RouteMetric[]>();
  for (const metric of allMetrics) {
    const key = `${metric.method}:${metric.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(metric);
  }

  const routes: RouteTrend[] = [];

  for (const [key, metrics] of grouped) {
    const [method, route] = key.split(/:(.+)/);
    const recent = metrics.filter((m) => m.timestamp >= windowStart);
    const older = metrics.filter(
      (m) => m.timestamp >= prevWindowStart && m.timestamp < windowStart
    );
    if (recent.length === 0) continue;
    routes.push(computeTrendForRoute(recent, older, route, method, windowMs));
  }

  routes.sort((a, b) => b.changePercent - a.changePercent);

  return {
    generatedAt: new Date().toISOString(),
    windowMs,
    routes,
  };
}
