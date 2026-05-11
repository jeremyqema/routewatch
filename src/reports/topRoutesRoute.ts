import { Router, Request, Response } from 'express';
import { computeTopRoutes, formatTopRoutesReport, TopRoutesSortBy } from './topRoutes';

const router = Router();

/**
 * GET /routewatch/top-routes
 * Query params:
 *   limit   - number of routes to return (default 10)
 *   sortBy  - avgDuration | maxDuration | callCount | totalDuration
 *   method  - filter by HTTP method (e.g. GET, POST)
 *   format  - 'json' (default) | 'text'
 */
router.get('/', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const sortBy = (req.query.sortBy as TopRoutesSortBy) || 'avgDuration';
  const method = req.query.method as string | undefined;
  const format = (req.query.format as string) || 'json';

  const validSortFields: TopRoutesSortBy[] = ['avgDuration', 'maxDuration', 'callCount', 'totalDuration'];
  if (!validSortFields.includes(sortBy)) {
    return res.status(400).json({ error: `Invalid sortBy value. Must be one of: ${validSortFields.join(', ')}` });
  }

  if (isNaN(limit) || limit < 1) {
    return res.status(400).json({ error: 'limit must be a positive integer' });
  }

  const entries = computeTopRoutes({ limit, sortBy, method });

  if (format === 'text') {
    return res.type('text/plain').send(formatTopRoutesReport(entries));
  }

  return res.json({ sortBy, limit, method: method || null, routes: entries });
});

export default router;
