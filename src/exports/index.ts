export { routewatch } from '../middleware/routewatch';
export { getMetrics, clearMetrics, recordMetric, getMetricsSummary } from '../metrics/store';
export { computeRouteSummary, generateSummaryReport, formatSummaryReport } from '../reports/summary';
export { exportMetrics, toCSV } from '../reports/export';
export { computeTrendForRoute, computeTrendReport, percentile } from '../reports/trend';
export { computeBaseline, compareToBaseline } from '../reports/baseline';
export type { BaselineEntry, BaselineReport } from '../reports/baseline';
export { recordAlert, getAlertHistory, clearAlertHistory, getAlertCount, getRecentAlerts } from '../alerts/alertHistory';
export { addAlertRule, removeAlertRule, getAlertRules, clearAlertRules, evaluateRules } from '../alerts/alertRules';
export { checkThreshold, formatAlertMessage } from '../alerts/threshold';
export type {
  RouteMetric,
  RouteWatchOptions,
  AlertRule,
  AlertEvent,
  TrendPoint,
  RouteTrend,
} from '../types';
