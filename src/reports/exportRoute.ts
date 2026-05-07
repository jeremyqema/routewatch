import { Router, Request, Response } from 'express';
import { exportMetrics, ExportFormat } from './export';

const router = Router();

/**
 * GET /routewatch/export
 * Query params:
 *   format  - 'json' (default) | 'csv'
 *   routes  - comma-separated list of "METHOD /path" keys to include
 */
router.get('/export', (req: Request, res: Response) => {
  const format = (req.query.format as ExportFormat) ?? 'json';

  if (format !== 'json' && format !== 'csv') {
    res.status(400).json({
      error: `Unsupported format "${format}". Use "json" or "csv".`,
    });
    return;
  }

  const routesParam = req.query.routes as string | undefined;
  const routes = routesParam
    ? routesParam.split(',').map((r) => r.trim()).filter(Boolean)
    : undefined;

  const output = exportMetrics({ format, routes });

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="routewatch-metrics.csv"'
    );
    res.send(output);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(output);
  }
});

export default router;
