import { Router, Request, Response } from 'express';
import { generateSummaryReport, formatSummaryReport } from './summary';
import { clearMetrics } from '../metrics/store';

const router = Router();

/**
 * GET /_routewatch/summary
 * Returns a JSON summary of all recorded route metrics.
 */
router.get('/summary', (_req: Request, res: Response) => {
  const report = generateSummaryReport();
  res.json(report);
});

/**
 * GET /_routewatch/summary/text
 * Returns a plain-text formatted summary report.
 */
router.get('/summary/text', (_req: Request, res: Response) => {
  const report = generateSummaryReport();
  res.type('text/plain').send(formatSummaryReport(report));
});

/**
 * DELETE /_routewatch/metrics
 * Clears all stored metrics. Useful for testing or resetting state.
 */
router.delete('/metrics', (_req: Request, res: Response) => {
  clearMetrics();
  res.json({ cleared: true, message: 'All metrics have been cleared.' });
});

export { router as summaryRouter };
