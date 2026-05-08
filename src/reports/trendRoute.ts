import { Router, Request, Response } from 'express';
import { computeTrendReport, computeTrendForRoute } from './trend';
import { getMetrics } from '../metrics/store';

const router = Router();

/**
 * GET /routewatch/trend
 * Returns trend report for all routes.
 * Optional query param: ?window=10 (number of recent requests to consider)
 */
router.get('/', (req: Request, res: Response) => {
  const metrics = getMetrics();
  const window = req.query.window ? parseInt(req.query.window as string, 10) : undefined;

  if (Object.keys(metrics).length === 0) {
    return res.status(200).json({ message: 'No metrics recorded yet.', trends: {} });
  }

  const report = computeTrendReport(metrics, window);
  return res.status(200).json(report);
});

/**
 * GET /routewatch/trend/:method/:route
 * Returns trend data for a specific route.
 * Example: /routewatch/trend/GET/api%2Fusers
 * Optional query param: ?window=10
 */
router.get('/:method/*', (req: Request, res: Response) => {
  const metrics = getMetrics();
  const method = req.params.method.toUpperCase();
  const routePath = '/' + (req.params as Record<string, string>)[0];
  const key = `${method} ${routePath}`;
  const window = req.query.window ? parseInt(req.query.window as string, 10) : undefined;

  const routeMetrics = metrics[key];
  if (!routeMetrics || routeMetrics.length === 0) {
    return res.status(404).json({ error: `No metrics found for route: ${key}` });
  }

  const trend = computeTrendForRoute(routeMetrics, window);
  return res.status(200).json({ route: key, ...trend });
});

export default router;
