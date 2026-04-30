export interface RouteWatchOptions {
  threshold?: number;
  onAlert?: (message: string, metric: RouteMetric) => void;
  skip?: (req: import('express').Request) => boolean;
}

export interface RouteMetric {
  route: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: string;
}

export interface RouteSummary {
  route: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
}

export interface SummaryReport {
  generatedAt: string;
  totalRequests: number;
  totalRoutes: number;
  slowestRoute: RouteSummary | null;
  routes: RouteSummary[];
}
