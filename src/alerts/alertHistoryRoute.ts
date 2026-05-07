import { Router, Request, Response } from 'express';
import { getAlertHistory, clearAlertHistory, getAlertCount, getRecentAlerts } from './alertHistory';

const router = Router();

/**
 * GET /routewatch/alerts
 * Returns all recorded alerts, optionally filtered by route.
 */
router.get('/', (req: Request, res: Response) => {
  const route = typeof req.query.route === 'string' ? req.query.route : undefined;
  const recentMs = req.query.recentMs ? Number(req.query.recentMs) : undefined;

  if (recentMs !== undefined && !isNaN(recentMs)) {
    return res.json({ alerts: getRecentAlerts(recentMs), count: getRecentAlerts(recentMs).length });
  }

  const alerts = getAlertHistory(route);
  res.json({ alerts, count: alerts.length });
});

/**
 * GET /routewatch/alerts/count
 * Returns the total number of recorded alerts.
 */
router.get('/count', (req: Request, res: Response) => {
  const route = typeof req.query.route === 'string' ? req.query.route : undefined;
  res.json({ count: getAlertCount(route) });
});

/**
 * DELETE /routewatch/alerts
 * Clears the alert history.
 */
router.delete('/', (_req: Request, res: Response) => {
  clearAlertHistory();
  res.json({ message: 'Alert history cleared.' });
});

export default router;
