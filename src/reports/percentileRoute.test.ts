import express, { Express } from 'express';
import request from 'supertest';
import percentileRouter from './percentileRoute';
import { recordMetric, clearMetrics } from '../metrics/store';
import { RouteMetric } from '../types';

function makeMetric(route: string, method: string, duration: number): RouteMetric {
  return { route, method, duration, timestamp: Date.now(), statusCode: 200 };
}

function buildApp(): Express {
  const app = express();
  app.use(percentileRouter);
  return app;
}

describe('GET /routewatch/percentiles', () => {
  beforeEach(() => clearMetrics());

  it('returns 200 with JSON report', async () => {
    recordMetric(makeMetric('/api/users', 'GET', 80));
    const res = await request(buildApp()).get('/routewatch/percentiles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('generatedAt');
    expect(res.body).toHaveProperty('routes');
    expect(Array.isArray(res.body.routes)).toBe(true);
  });

  it('includes percentile fields in each route entry', async () => {
    [10, 50, 100, 200, 300].forEach((d) =>
      recordMetric(makeMetric('/api/orders', 'GET', d)),
    );

    const res = await request(buildApp()).get('/routewatch/percentiles');
    expect(res.status).toBe(200);

    const route = res.body.routes[0];
    expect(route).toHaveProperty('p50');
    expect(route).toHaveProperty('p75');
    expect(route).toHaveProperty('p90');
    expect(route).toHaveProperty('p95');
    expect(route).toHaveProperty('p99');
    expect(route).toHaveProperty('min');
    expect(route).toHaveProperty('max');
    expect(route).toHaveProperty('count');
  });

  it('returns plain text when format=text', async () => {
    recordMetric(makeMetric('/api/ping', 'GET', 15));
    const res = await request(buildApp()).get('/routewatch/percentiles?format=text');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('Percentile Report');
    expect(res.text).toContain('/api/ping');
  });

  it('returns empty routes array when no metrics', async () => {
    const res = await request(buildApp()).get('/routewatch/percentiles');
    expect(res.status).toBe(200);
    expect(res.body.routes).toHaveLength(0);
  });
});
