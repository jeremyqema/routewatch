export interface RouteMetricEntry {
  route: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
}

export interface RouteMetric {
  route: string;
  method: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95?: number;
  count: number;
  errorRate?: number;
}

export interface AlertEntry {
  route: string;
  method: string;
  duration: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export type AlertCondition = 'avg_exceeds' | 'p95_exceeds' | 'error_rate_exceeds';

export interface AlertRule {
  id: string;
  label?: string;
  condition: AlertCondition;
  threshold: number;
  routePattern?: string;
  method?: string;
  enabled: boolean;
}

export interface RouteWatchOptions {
  threshold?: number;
  onAlert?: (entry: AlertEntry) => void;
  alertRules?: AlertRule[];
}
