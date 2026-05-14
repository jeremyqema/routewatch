import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types/index';

export interface SlowRouteEntry {
  route: string;
  method: string;
  avgDuration: number;
  maxDuration: number;
  callCount: number;
  slowCallCount: number;
  slowCallPercent: number;
}

export interface SlowRoutesReport {
  threshold: number;
  routes: SlowRouteEntry[];
  generatedAt: string;
}

export function computeSlowRoutes(
  thresholdMs: number = 500,
  topN: number = 10
): SlowRoutesReport {
  const metrics = getMetrics();

  const grouped = new Map<string, RouteMetric[]>();
  for (const m of metrics) {
    const key = `${m.method}:${m.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(m);
  }

  const entries: SlowRouteEntry[] = [];

  for (const [key, group] of grouped.entries()) {
    const [method, route] = key.split(/:(.+)/);
    const durations = group.map((m) => m.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const slowCalls = durations.filter((d) => d >= thresholdMs);

    if (slowCalls.length === 0) continue;

    entries.push({
      route,
      method,
      avgDuration: Math.round(avgDuration * 100) / 100,
      maxDuration,
      callCount: group.length,
      slowCallCount: slowCalls.length,
      slowCallPercent: Math.round((slowCalls.length / group.length) * 10000) / 100,
    });
  }

  entries.sort((a, b) => b.slowCallPercent - a.slowCallPercent || b.avgDuration - a.avgDuration);

  return {
    threshold: thresholdMs,
    routes: entries.slice(0, topN),
    generatedAt: new Date().toISOString(),
  };
}

export function formatSlowRoutesReport(report: SlowRoutesReport): string {
  const lines: string[] = [
    `Slow Routes Report (threshold: ${report.threshold}ms) — ${report.generatedAt}`,
    '='.repeat(60),
  ];

  if (report.routes.length === 0) {
    lines.push('No slow routes detected.');
    return lines.join('\n');
  }

  for (const r of report.routes) {
    lines.push(
      `[${r.method}] ${r.route} — avg: ${r.avgDuration}ms, max: ${r.maxDuration}ms, ` +
        `slow: ${r.slowCallCount}/${r.callCount} (${r.slowCallPercent}%)`
    );
  }

  return lines.join('\n');
}
