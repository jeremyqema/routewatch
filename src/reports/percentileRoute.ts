import { Router, Request, Response } from 'express';
import { computePercentileReport, formatPercentileReport } from './percentileReport';

const router = Router();

/**
 * GET /routewatch/percentiles
 * Returns percentile breakdown (p50/p75/p90/p95/p99) for all tracked routes.
 * Query params:
 *   - format=text  → plain-text report
 *   - format=json  (default) → JSON
 */
router.get('/routewatch/percentiles', (req: Request, res: Response) => {
  try {
    const report = computePercentileReport();

    if (req.query.format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      return res.send(formatPercentileReport(report));
    }

    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute percentile report' });
  }
});

export default router;
