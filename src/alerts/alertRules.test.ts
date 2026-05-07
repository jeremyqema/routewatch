import {
  addAlertRule,
  removeAlertRule,
  getAlertRules,
  clearAlertRules,
  evaluateRules,
} from './alertRules';
import { AlertRule, RouteMetric } from '../types';

const baseMetric: RouteMetric = {
  route: '/api/users',
  method: 'GET',
  avgDuration: 300,
  minDuration: 100,
  maxDuration: 800,
  p95: 750,
  count: 50,
  errorRate: 0.1,
};

const rule: AlertRule = {
  id: 'rule-1',
  condition: 'avg_exceeds',
  threshold: 200,
  enabled: true,
};

beforeEach(() => clearAlertRules());

describe('addAlertRule / getAlertRules', () => {
  it('adds a rule', () => {
    addAlertRule(rule);
    expect(getAlertRules()).toHaveLength(1);
  });

  it('replaces rule with same id', () => {
    addAlertRule(rule);
    addAlertRule({ ...rule, threshold: 500 });
    const rules = getAlertRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].threshold).toBe(500);
  });
});

describe('removeAlertRule', () => {
  it('removes an existing rule', () => {
    addAlertRule(rule);
    expect(removeAlertRule('rule-1')).toBe(true);
    expect(getAlertRules()).toHaveLength(0);
  });

  it('returns false for unknown id', () => {
    expect(removeAlertRule('nonexistent')).toBe(false);
  });
});

describe('evaluateRules', () => {
  it('triggers avg_exceeds rule when avg is over threshold', () => {
    addAlertRule(rule);
    const triggered = evaluateRules(baseMetric);
    expect(triggered).toHaveLength(1);
  });

  it('does not trigger disabled rules', () => {
    addAlertRule({ ...rule, enabled: false });
    expect(evaluateRules(baseMetric)).toHaveLength(0);
  });

  it('filters by routePattern', () => {
    addAlertRule({ ...rule, routePattern: '/api/orders' });
    expect(evaluateRules(baseMetric)).toHaveLength(0);
  });

  it('filters by method', () => {
    addAlertRule({ ...rule, method: 'POST' });
    expect(evaluateRules(baseMetric)).toHaveLength(0);
  });

  it('triggers p95_exceeds rule', () => {
    addAlertRule({ id: 'p95-rule', condition: 'p95_exceeds', threshold: 500, enabled: true });
    expect(evaluateRules(baseMetric)).toHaveLength(1);
  });

  it('triggers error_rate_exceeds rule', () => {
    addAlertRule({ id: 'err-rule', condition: 'error_rate_exceeds', threshold: 0.05, enabled: true });
    expect(evaluateRules(baseMetric)).toHaveLength(1);
  });
});
