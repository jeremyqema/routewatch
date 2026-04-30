import { getMetrics } from '../metrics/store';
import { RouteMetric, RouteSummary, SummaryReport } from '../types';

export function computeRouteSummary(key: string, metrics: RouteMetric[]): RouteSummary {
  if (metrics.length === 0) {
    return { route: key, count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0, p95Duration: 0 };
  }

  const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
  const count = durations.length;
  const total = durations.reduce((sum, d) => sum + d, 0);
  const avgDuration = Math.round(total / count);
  const minDuration = durations[0];
  const maxDuration = durations[count - 1];

  const p95Index = Math.max(0, Math.ceil(count * 0.95) - 1);
  const p95Duration = durations[p95Index];

  return { route: key, count, avgDuration, minDuration, maxDuration, p95Duration };
}

export function generateSummaryReport(): SummaryReport {
  const allMetrics = getMetrics();
  const routes: RouteSummary[] = [];

  for (const [key, metrics] of Object.entries(allMetrics)) {
    routes.push(computeRouteSummary(key, metrics));
  }

  routes.sort((a, b) => b.avgDuration - a.avgDuration);

  const totalRequests = routes.reduce((sum, r) => sum + r.count, 0);
  const slowestRoute = routes[0] ?? null;

  return {
    generatedAt: new Date().toISOString(),
    totalRequests,
    totalRoutes: routes.length,
    slowestRoute,
    routes,
  };
}

export function formatSummaryReport(report: SummaryReport): string {
  const lines: string[] = [
    `RouteWatch Summary Report — ${report.generatedAt}`,
    `Total Requests: ${report.totalRequests} across ${report.totalRoutes} route(s)`,
    '',
  ];

  if (report.slowestRoute) {
    lines.push(`Slowest Route: ${report.slowestRoute.route} (avg ${report.slowestRoute.avgDuration}ms)`);
    lines.push('');
  }

  for (const r of report.routes) {
    lines.push(
      `  ${r.route} — count: ${r.count}, avg: ${r.avgDuration}ms, min: ${r.minDuration}ms, max: ${r.maxDuration}ms, p95: ${r.p95Duration}ms`
    );
  }

  return lines.join('\n');
}
