import { RouteMetric } from '../types';
import { computeBaseline } from './baseline';

export interface AnomalyResult {
  route: string;
  method: string;
  timestamp: number;
  duration: number;
  baselineMean: number;
  baselineStdDev: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
}

export interface AnomalyReport {
  generatedAt: number;
  anomalies: AnomalyResult[];
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function detectAnomalies(
  metrics: RouteMetric[],
  zScoreThreshold = 2.5
): AnomalyReport {
  const baseline = computeBaseline(metrics);
  const anomalies: AnomalyResult[] = [];

  for (const metric of metrics) {
    const key = `${metric.method}:${metric.route}`;
    const base = baseline[key];
    if (!base || base.sampleCount < 5) continue;

    const sd = stdDev(
      metrics
        .filter(m => m.method === metric.method && m.route === metric.route)
        .map(m => m.duration)
    );

    if (sd === 0) continue;

    const z = (metric.duration - base.meanDuration) / sd;

    if (Math.abs(z) >= zScoreThreshold) {
      const absZ = Math.abs(z);
      const severity: AnomalyResult['severity'] =
        absZ >= 4 ? 'high' : absZ >= 3 ? 'medium' : 'low';

      anomalies.push({
        route: metric.route,
        method: metric.method,
        timestamp: metric.timestamp,
        duration: metric.duration,
        baselineMean: base.meanDuration,
        baselineStdDev: sd,
        zScore: parseFloat(z.toFixed(3)),
        severity,
      });
    }
  }

  anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return { generatedAt: Date.now(), anomalies };
}
