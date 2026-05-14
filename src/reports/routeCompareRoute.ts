import { Router, Request, Response } from 'express';
import { getMetrics } from '../metrics/store';
import { computeRouteComparison } from './routeCompare';

const router = Router();

/**
 * GET /routewatch/compare?routes=GET:/api/users,POST:/api/orders
 * Returns a side-by-side comparison of the specified routes.
 */
router.get('/', (req: Request, res: Response) => {
  const raw = req.query.routes;

  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({
      error: 'Query parameter "routes" is required (comma-separated list of route keys)',
    });
  }

  const routeKeys = raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (routeKeys.length < 2) {
    return res.status(400).json({
      error: 'At least two route keys are required for comparison',
    });
  }

  const allMetrics = getMetrics();

  const missing = routeKeys.filter(
    (key) => !allMetrics.some((m) => `${m.method}:${m.route}` === key)
  );

  if (missing.length > 0) {
    return res.status(404).json({
      error: `No metrics found for route(s): ${missing.join(', ')}`,
    });
  }

  const comparison = computeRouteComparison(allMetrics, routeKeys);

  return res.json({ routes: comparison });
});

export default router;
