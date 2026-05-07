import { AlertRule, RouteMetric } from '../types';

const rules: AlertRule[] = [];

export function addAlertRule(rule: AlertRule): void {
  const existing = rules.findIndex(r => r.id === rule.id);
  if (existing !== -1) {
    rules[existing] = rule;
  } else {
    rules.push(rule);
  }
}

export function removeAlertRule(id: string): boolean {
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return false;
  rules.splice(index, 1);
  return true;
}

export function getAlertRules(): AlertRule[] {
  return [...rules];
}

export function clearAlertRules(): void {
  rules.length = 0;
}

export function evaluateRules(metric: RouteMetric): AlertRule[] {
  return rules.filter(rule => {
    if (!rule.enabled) return false;
    if (rule.routePattern && !metric.route.includes(rule.routePattern)) return false;
    if (rule.method && rule.method.toUpperCase() !== metric.method.toUpperCase()) return false;
    switch (rule.condition) {
      case 'p95_exceeds':
        return metric.p95 !== undefined && metric.p95 > rule.threshold;
      case 'error_rate_exceeds':
        return metric.errorRate !== undefined && metric.errorRate > rule.threshold;
      case 'avg_exceeds':
      default:
        return metric.avgDuration > rule.threshold;
    }
  });
}
