import { getMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

export interface HeatmapCell {
  hour: number;
  day: number; // 0 = Sunday, 6 = Saturday
  count: number;
  avgDuration: number;
}

export interface HeatmapReport {
  route: string;
  cells: HeatmapCell[];
  peakHour: number;
  peakDay: number;
}

export function buildHeatmap(metrics: RouteMetric[]): HeatmapCell[] {
  const buckets: Record<string, { total: number; count: number }> = {};

  for (const m of metrics) {
    const date = new Date(m.timestamp);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();
    const key = `${day}:${hour}`;
    if (!buckets[key]) {
      buckets[key] = { total: 0, count: 0 };
    }
    buckets[key].total += m.duration;
    buckets[key].count += 1;
  }

  return Object.entries(buckets).map(([key, val]) => {
    const [day, hour] = key.split(':').map(Number);
    return {
      day,
      hour,
      count: val.count,
      avgDuration: val.count > 0 ? val.total / val.count : 0,
    };
  });
}

export function computeHeatmapReport(route: string): HeatmapReport {
  const all = getMetrics();
  const filtered = all.filter((m) => m.route === route);
  const cells = buildHeatmap(filtered);

  let peakCell = cells[0] ?? { day: 0, hour: 0 };
  for (const cell of cells) {
    if (cell.count > peakCell.count) {
      peakCell = cell;
    }
  }

  return {
    route,
    cells,
    peakHour: peakCell.hour,
    peakDay: peakCell.day,
  };
}
