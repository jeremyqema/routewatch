import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types';
import { percentile } from './trend';

export interface PercentileResult {
  route: string;
  method: string;
  count: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface PercentileReport {
  generatedAt: string;
  routes: PercentileResult[];
}

export function computePercentileReport(): PercentileReport {
  const metrics = getMetrics();
  const grouped = new Map<string, RouteMetric[]>();

  for (const metric of metrics) {
    const key = `${metric.method}:${metric.route}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(metric);
  }

  const routes: PercentileResult[] = [];

  for (const [key, entries] of grouped.entries()) {
    const [method, route] = key.split(':');
    const durations = entries.map((e) => e.duration).sort((a, b) => a - b);

    routes.push({
      route,
      method,
      count: durations.length,
      p50: percentile(durations, 50),
      p75: percentile(durations, 75),
      p90: percentile(durations, 90),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      min: durations[0],
      max: durations[durations.length - 1],
    });
  }

  routes.sort((a, b) => b.p95 - a.p95);

  return {
    generatedAt: new Date().toISOString(),
    routes,
  };
}

export function formatPercentileReport(report: PercentileReport): string {
  const lines: string[] = [
    `Percentile Report — ${report.generatedAt}`,
    '='.repeat(60),
  ];

  for (const r of report.routes) {
    lines.push(
      `[${r.method}] ${r.route} (n=${r.count})`,
      `  min=${r.min}ms  p50=${r.p50}ms  p75=${r.p75}ms  p90=${r.p90}ms  p95=${r.p95}ms  p99=${r.p99}ms  max=${r.max}ms`,
    );
  }

  if (report.routes.length === 0) {
    lines.push('No data available.');
  }

  return lines.join('\n');
}
