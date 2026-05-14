import { Router, Request, Response } from 'express';
import { computeSlowRoutes, formatSlowRoutesReport } from './slowRoutes';

const router = Router();

/**
 * GET /routewatch/slow-routes
 * Query params:
 *   threshold  - ms threshold for a "slow" call (default: 500)
 *   topN       - max routes to return (default: 10)
 *   format     - "json" (default) | "text"
 */
router.get('/', (req: Request, res: Response) => {
  const threshold = req.query.threshold !== undefined
    ? parseInt(req.query.threshold as string, 10)
    : 500;

  const topN = req.query.topN !== undefined
    ? parseInt(req.query.topN as string, 10)
    : 10;

  if (isNaN(threshold) || threshold < 0) {
    return res.status(400).json({ error: 'Invalid threshold value' });
  }

  if (isNaN(topN) || topN < 1) {
    return res.status(400).json({ error: 'Invalid topN value' });
  }

  const report = computeSlowRoutes(threshold, topN);

  if (req.query.format === 'text') {
    res.type('text/plain').send(formatSlowRoutesReport(report));
  } else {
    res.json(report);
  }
});

export default router;
