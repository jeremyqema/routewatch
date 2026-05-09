import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types';
import { percentile } from './trend';

export interface BaselineEntry {
  route: string;
  method: string;
  sampleCount: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  capturedAt: string;
}

export interface BaselineReport {
  generatedAt: string;
  entries: BaselineEntry[];
}

function groupMetrics(metrics: RouteMetric[]): Map<string, RouteMetric[]> {
  const map = new Map<string, RouteMetric[]>();
  for (const m of metrics) {
    const key = `${m.method}:${m.route}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return map;
}

export function computeBaseline(): BaselineReport {
  const metrics = getMetrics();
  const grouped = groupMetrics(metrics);
  const entries: BaselineEntry[] = [];

  for (const [key, routeMetrics] of grouped) {
    const [method, route] = key.split(/:(.+)/);
    const durations = routeMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const mean =
      durations.length > 0
        ? durations.reduce((s, d) => s + d, 0) / durations.length
        : 0;

    entries.push({
      route,
      method,
      sampleCount: durations.length,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      mean: parseFloat(mean.toFixed(2)),
      capturedAt: new Date().toISOString(),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export function compareToBaseline(
  baseline: BaselineReport,
  current: BaselineReport
): { route: string; method: string; p95Delta: number; p50Delta: number }[] {
  const results = [];
  for (const curr of current.entries) {
    const base = baseline.entries.find(
      (e) => e.route === curr.route && e.method === curr.method
    );
    if (!base) continue;
    results.push({
      route: curr.route,
      method: curr.method,
      p95Delta: parseFloat((curr.p95 - base.p95).toFixed(2)),
      p50Delta: parseFloat((curr.p50 - base.p50).toFixed(2)),
    });
  }
  return results;
}
