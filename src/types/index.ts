export interface RouteWatchOptions {
  /**
   * Duration in milliseconds above which a route is considered slow.
   * Defaults to 1000ms.
   */
  slowThresholdMs?: number;

  /**
   * Callback invoked when a route exceeds the slow threshold.
   */
  onSlowRoute?: (metric: RouteMetrics) => void;

  /**
   * Enable or disable the middleware entirely.
   * Defaults to true.
   */
  enabled?: boolean;
}

export interface RouteMetrics {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

export interface MetricsStore {
  [routeKey: string]: RouteMetrics[];
}
