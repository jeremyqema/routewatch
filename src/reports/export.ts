import { getMetrics, getRouteKeys } from '../metrics/store';
import { computeRouteSummary } from './summary';
import { RouteMetric } from '../types';

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format?: ExportFormat;
  routes?: string[];
}

export function exportMetrics(options: ExportOptions = {}): string {
  const { format = 'json', routes } = options;

  const keys = routes ?? getRouteKeys();
  const summaries = keys.map((key) => {
    const [method, path] = key.split(' ');
    const metrics: RouteMetric[] = getMetrics(method, path);
    return { route: key, ...computeRouteSummary(metrics) };
  });

  if (format === 'csv') {
    return toCSV(summaries);
  }

  return JSON.stringify(summaries, null, 2);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === undefined || val === null ? '' : String(val);
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    ),
  ];

  return lines.join('\n');
}
