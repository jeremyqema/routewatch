import { Router, Request, Response } from 'express';
import { computeBaseline, compareToBaseline, BaselineReport } from './baseline';

const router = Router();

let savedBaseline: BaselineReport | null = null;

/**
 * GET /routewatch/baseline
 * Returns a freshly computed baseline from current metrics.
 */
router.get('/', (_req: Request, res: Response) => {
  const baseline = computeBaseline();
  res.json(baseline);
});

/**
 * POST /routewatch/baseline/save
 * Saves the current metric snapshot as the stored baseline.
 */
router.post('/save', (_req: Request, res: Response) => {
  savedBaseline = computeBaseline();
  res.json({ message: 'Baseline saved.', generatedAt: savedBaseline.generatedAt });
});

/**
 * GET /routewatch/baseline/compare
 * Compares the current metrics against the saved baseline.
 */
router.get('/compare', (_req: Request, res: Response) => {
  if (!savedBaseline) {
    res.status(404).json({ error: 'No baseline saved. POST /baseline/save first.' });
    return;
  }
  const current = computeBaseline();
  const diff = compareToBaseline(savedBaseline, current);
  res.json({
    baselineCapturedAt: savedBaseline.generatedAt,
    comparedAt: current.generatedAt,
    deltas: diff,
  });
});

export default router;
