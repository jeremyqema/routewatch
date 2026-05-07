import { Router, Request, Response } from 'express';
import {
  addAlertRule,
  removeAlertRule,
  getAlertRules,
  clearAlertRules,
} from './alertRules';
import { AlertRule } from '../types';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ rules: getAlertRules() });
});

router.post('/', (req: Request, res: Response) => {
  const rule: AlertRule = req.body;
  if (!rule || !rule.id || !rule.threshold || !rule.condition) {
    return res.status(400).json({ error: 'Missing required fields: id, threshold, condition' });
  }
  if (rule.enabled === undefined) rule.enabled = true;
  addAlertRule(rule);
  res.status(201).json({ message: 'Alert rule added', rule });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const removed = removeAlertRule(id);
  if (!removed) {
    return res.status(404).json({ error: `Rule with id '${id}' not found` });
  }
  res.json({ message: `Rule '${id}' removed` });
});

router.delete('/', (_req: Request, res: Response) => {
  clearAlertRules();
  res.json({ message: 'All alert rules cleared' });
});

export default router;
