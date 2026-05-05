import {
  routewatch,
  recordMetric,
  getMetrics,
  clearMetrics,
  getRouteKeys,
  checkThreshold,
  formatAlertMessage,
  computeRouteSummary,
  generateSummaryReport,
  formatSummaryReport,
  summaryRoute,
} from './index';

describe('public API exports', () => {
  it('exports routewatch middleware factory', () => {
    expect(typeof routewatch).toBe('function');
  });

  it('exports metric store functions', () => {
    expect(typeof recordMetric).toBe('function');
    expect(typeof getMetrics).toBe('function');
    expect(typeof clearMetrics).toBe('function');
    expect(typeof getRouteKeys).toBe('function');
  });

  it('exports alert threshold helpers', () => {
    expect(typeof checkThreshold).toBe('function');
    expect(typeof formatAlertMessage).toBe('function');
  });

  it('exports summary report utilities', () => {
    expect(typeof computeRouteSummary).toBe('function');
    expect(typeof generateSummaryReport).toBe('function');
    expect(typeof formatSummaryReport).toBe('function');
  });

  it('exports summaryRoute express handler', () => {
    expect(typeof summaryRoute).toBe('function');
  });
});
