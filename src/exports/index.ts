/**
 * routewatch public API
 * Central export point for all public-facing modules.
 */

export { routewatch } from '../middleware/routewatch';
export { recordMetric, getMetrics, clearMetrics, getRouteKeys } from '../metrics/store';
export { checkThreshold, formatAlertMessage } from '../alerts/threshold';
export {
  computeRouteSummary,
  generateSummaryReport,
  formatSummaryReport,
} from '../reports/summary';
export { summaryRoute } from '../reports/summaryRoute';
export type {
  RouteWatchOptions,
  RouteMetric,
  AlertHandler,
  RouteSummary,
  SummaryReport,
} from '../types/index';
