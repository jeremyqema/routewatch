import { Router, Request, Response } from 'express';
import { getRouteKeys } from '../metrics/store';
import { computeHeatmapReport } from './heatmap';

const router = Router();

/**
 * GET /routewatch/heatmap
 * Returns heatmap data for all routes or a specific route via ?route=
 */
router.get('/', (req: Request, res: Response) => {
  const routeFilter = req.query.route as string | undefined;
  const routes = routeFilter ? [routeFilter] : getRouteKeys();

  if (routes.length === 0) {
    return res.status(200).json({ heatmaps: [] });
  }

  const heatmaps = routes.map((r) => computeHeatmapReport(r));
  return res.status(200).json({ heatmaps });
});

/**
 * GET /routewatch/heatmap/:route
 * Returns heatmap data for a specific route (path param, URL-encoded)
 */
router.get('/:route', (req: Request, res: Response) => {
  const route = decodeURIComponent(req.params.route);
  const known = getRouteKeys();

  if (!known.includes(route)) {
    return res.status(404).json({ error: `No metrics found for route: ${route}` });
  }

  const report = computeHeatmapReport(route);
  return res.status(200).json(report);
});

export default router;
