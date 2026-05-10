import { Router, Request, Response } from 'express';
import { getMetrics } from '../metrics/store';
import { detectAnomalies } from './anomaly';

const router = Router();

/**
 * GET /routewatch/anomalies
 * Query params:
 *   - threshold: z-score threshold (default 2.5)
 *   - severity: filter by severity (low | medium | high)
 *   - route: filter by route pattern substring
 */
router.get('/', (req: Request, res: Response) => {
  const metrics = getMetrics();

  if (metrics.length === 0) {
    return res.json({ generatedAt: Date.now(), anomalies: [] });
  }

  const threshold = req.query.threshold
    ? parseFloat(req.query.threshold as string)
    : 2.5;

  if (isNaN(threshold) || threshold <= 0) {
    return res.status(400).json({ error: 'Invalid threshold value' });
  }

  let report = detectAnomalies(metrics, threshold);

  if (req.query.severity) {
    const sev = req.query.severity as string;
    if (!['low', 'medium', 'high'].includes(sev)) {
      return res.status(400).json({ error: 'Invalid severity. Must be low, medium, or high.' });
    }
    report = {
      ...report,
      anomalies: report.anomalies.filter(a => a.severity === sev),
    };
  }

  if (req.query.route) {
    const routeFilter = req.query.route as string;
    report = {
      ...report,
      anomalies: report.anomalies.filter(a => a.route.includes(routeFilter)),
    };
  }

  return res.json(report);
});

export default router;
