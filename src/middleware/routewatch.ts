import { Request, Response, NextFunction } from 'express';
import { RouteWatchOptions, RouteMetrics } from '../types';
import { recordMetric } from '../metrics/store';
import { checkThreshold } from '../alerts/threshold';

const DEFAULT_SLOW_THRESHOLD_MS = 1000;

export function routewatch(options: RouteWatchOptions = {}) {
  const threshold = options.slowThresholdMs ?? DEFAULT_SLOW_THRESHOLD_MS;
  const onSlowRoute = options.onSlowRoute;
  const enabled = options.enabled ?? true;

  return function routewatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (!enabled) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const route = req.path;
    const method = req.method;

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;

      const metric: RouteMetrics = {
        route,
        method,
        statusCode: res.statusCode,
        durationMs,
        timestamp: new Date(),
      };

      recordMetric(metric);

      const isSlow = checkThreshold(durationMs, threshold);
      if (isSlow && onSlowRoute) {
        onSlowRoute(metric);
      }
    });

    next();
  };
}
